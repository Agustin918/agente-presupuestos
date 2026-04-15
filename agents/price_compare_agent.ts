import { PrecioCache } from "../blueprint/schema";
import { PRECIO_VIGENCIA_DIAS, PRECIO_MAX_ANTIGUEDAD_DIAS } from "../config/settings";
import * as fs from "fs";
import * as path from "path";
import { FUENTES_PRECIO, getFuentesHabilitadas, FuentePrecio } from "../data/fuentes_comparativas";

const CACHE_PATH = "./data/cache/precios.json";
const PRECIOS_COMPARADOS_PATH = "./data/cache/precios_comparados.json";

interface ResultadoPrecio {
  material: string;
  precio: number;
  unidad: string;
  fuente_url: string;
  fuente_nombre: string;
  fecha: string;
  vigencia_dias: number;
  precio_desactualizado?: boolean;
}

interface ResultadoComparado {
  material: string;
  precios: {
    fuente: string;
    precio: number;
    unidad: string;
    url: string;
    fecha: string;
  }[];
  mejor_precio: {
    fuente: string;
    precio: number;
    unidad: string;
    url: string;
  };
  promedio: number;
  fecha: string;
}

function diasDiff(fecha1: string, fecha2: string): number {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function leerCache(): PrecioCache {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Error leyendo cache:", e);
  }
  return {};
}

function guardarCache(cache: PrecioCache): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function leerPreciosComparados(): Record<string, ResultadoComparado> {
  try {
    if (fs.existsSync(PRECIOS_COMPARADOS_PATH)) {
      return JSON.parse(fs.readFileSync(PRECIOS_COMPARADOS_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Error leyendo precios comparados:", e);
  }
  return {};
}

function guardarPreciosComparados(precios: Record<string, ResultadoComparado>): void {
  const dir = path.dirname(PRECIOS_COMPARADOS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PRECIOS_COMPARADOS_PATH, JSON.stringify(precios, null, 2));
}

export async function getPreciosComparados(
  materiales: string[],
  ubicacion?: string
): Promise<Record<string, ResultadoComparado>> {
  const resultados: Record<string, ResultadoComparado> = {};
  const preciosComparados = leerPreciosComparados();
  const fuentes = getFuentesHabilitadas();
  
  console.log(`[PriceCompare] Buscando precios en ${fuentes.length} fuentes...`);

  for (const material of materiales) {
    console.log(`[PriceCompare] Comparando: ${material}`);
    
    // Verificar caché
    const cached = preciosComparados[material];
    if (cached && diasDiff(cached.fecha, new Date().toISOString().split('T')[0]) < PRECIO_VIGENCIA_DIAS) {
      console.log(`  ✓ Usando caché de ${cached.fecha}`);
      resultados[material] = cached;
      continue;
    }

    // Buscar en todas las fuentes
    const preciosFuente: ResultadoComparado['precios'] = [];
    
    for (const fuente of fuentes) {
      try {
        const precio = await buscarEnFuente(material, fuente);
        if (precio) {
          preciosFuente.push(precio);
          console.log(`  ✓ ${fuente.nombre}: $${precio.precio.toLocaleString('es-AR')} (${precio.unidad})`);
        }
      } catch (e) {
        console.log(`  ✗ ${fuente.nombre}: Sin resultados`);
      }
    }

    // Agregar precio mock si no hay resultados
    if (preciosFuente.length === 0) {
      const mock = getPrecioMock(material);
      preciosFuente.push(mock);
      console.log(`  ~ Fallback mock: $${mock.precio.toLocaleString('es-AR')}`);
    }

    // Calcular mejor precio
    const preciosNumeros = preciosFuente.map(p => p.precio);
    const mejor = preciosFuente.reduce((min, p) => p.precio < min.precio ? p : min);
    
    const resultado: ResultadoComparado = {
      material,
      precios: preciosFuente,
      mejor_precio: mejor,
      promedio: Math.round(preciosNumeros.reduce((a, b) => a + b, 0) / preciosNumeros.length),
      fecha: new Date().toISOString().split('T')[0],
    };

    resultados[material] = resultado;
  }

  guardarPreciosComparados(resultados);
  
  const mejorTotal = Object.values(resultados).filter(r => 
    r.precios.some(p => p.precio === r.mejor_precio.precio)
  ).length;
  
  console.log(`[PriceCompare] ✓ ${Object.keys(resultados).length} materiales comparados`);
  
  return resultados;
}

async function buscarEnFuente(
  material: string,
  fuente: FuentePrecio
): Promise<{ fuente: string; precio: number; unidad: string; url: string; fecha: string } | null> {
  // Por ahora usamos scraping simple
  // En producción usar Playwright MCP
  const url = fuente.buscar(material);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    
    // Extraer precio con regex (adaptar según la estructura de cada sitio)
    const precioMatch = html.match(/\$?([\d.]+)\s*(?: pesos?|ARS)?/i);
    
    if (precioMatch) {
      const precio = parseFloat(precioMatch[1].replace(/\./g, '').replace(',', '.'));
      if (precio > 0 && precio < 10000000) { // Filtrar precios absurdos
        return {
          fuente: fuente.nombre,
          precio,
          unidad: 'ARS',
          url,
          fecha: new Date().toISOString().split('T')[0],
        };
      }
    }
  } catch (e) {
    // Silenciar errores de fetch individual
  }

  return null;
}

function getPrecioMock(material: string): { fuente: string; precio: number; unidad: string; url: string; fecha: string } {
  const preciosMock: Record<string, number> = {
    'ladrillo': 850,
    'ladrillo hueco': 450,
    'ladrillo 12': 550,
    'ladrillo 18': 850,
    'cemento': 4500,
    'cemento portland': 4700,
    'arena': 3200,
    'arena gruesa': 3500,
    'cal': 2800,
    'hierro': 1500,
    'hierro 6mm': 180,
    'hierro 8mm': 280,
    'hierro 10mm': 450,
    'chapa': 12500,
    'chapa galvanizada': 13500,
    'chapa trapezoidal': 15000,
    'chapa acanalada': 14000,
    'porcelanato': 4500,
    'ceramico': 2500,
    'gres': 3500,
    'inodoro': 45000,
    'bidet': 25000,
    'lavatorio': 28000,
    'griferia': 15000,
    'vanitory': 35000,
    'cable': 1500,
    'cable unipolar': 1800,
    'caño': 1200,
    'caño pvc': 1500,
    'caño gas': 3500,
    'regulador gas': 4200,
    'pintura': 8500,
    'latex': 12000,
    'steel frame': 8500,
    'montante': 2500,
    'durlock': 450,
    'membrana': 6000,
    'tornillo': 15,
    'tornillo autoperforante': 25,
    'madera': 5000,
    'listón': 800,
    'deck': 12000,
  };

  const precio = preciosMock[material.toLowerCase()] || 1000 + Math.random() * 500;
  
  return {
    fuente: 'Estimado',
    precio: Math.round(precio),
    unidad: 'ARS',
    url: 'mock://precios',
    fecha: new Date().toISOString().split('T')[0],
  };
}

export async function getPriceFromCache(material: string): Promise<ResultadoPrecio | null> {
  const cache = leerCache();
  const entry = cache[material];

  if (!entry) return null;

  const hoy = new Date().toISOString().split("T")[0];
  const dias = diasDiff(entry.fecha, hoy);

  return {
    material,
    precio: entry.precio,
    unidad: entry.unidad,
    fuente_url: entry.fuente_url,
    fuente_nombre: entry.fuente_nombre || 'Cache',
    fecha: entry.fecha,
    vigencia_dias: PRECIO_VIGENCIA_DIAS - dias,
  };
}

export async function getPrices(
  materiales: string[],
  ubicacion: string
): Promise<Record<string, ResultadoPrecio>> {
  const resultados: Record<string, ResultadoPrecio> = {};
  
  // Usar precios comparados
  const comparados = await getPreciosComparados(materiales, ubicacion);
  
  for (const [material, data] of Object.entries(comparados)) {
    resultados[material] = {
      material,
      precio: data.mejor_precio.precio,
      unidad: data.mejor_precio.unidad,
      fuente_url: data.mejor_precio.url,
      fuente_nombre: data.mejor_precio.fuente,
      fecha: data.fecha,
      vigencia_dias: PRECIO_VIGENCIA_DIAS,
    };
  }

  const frescos = Object.values(resultados).filter((r) => r.vigencia_dias > 5).length;
  console.log(`[Research] Precios: ${frescos} frescos, ${Object.keys(resultados).length - frescos} del cache`);

  return resultados;
}

export async function getAllPricesForBlueprint(
  materiales: string[]
): Promise<{
  mejores: Record<string, ResultadoPrecio>;
  comparacion: Record<string, ResultadoComparado>;
}> {
  const comparacion = await getPreciosComparados(materiales);
  
  const mejores: Record<string, ResultadoPrecio> = {};
  for (const [material, data] of Object.entries(comparacion)) {
    mejores[material] = {
      material,
      precio: data.mejor_precio.precio,
      unidad: data.mejor_precio.unidad,
      fuente_url: data.mejor_precio.url,
      fuente_nombre: data.mejor_precio.fuente,
      fecha: data.fecha,
      vigencia_dias: PRECIO_VIGENCIA_DIAS,
    };
  }

  return { mejores, comparacion };
}

export const priceCompareAgent = {
  getPreciosComparados,
  getAllPricesForBlueprint,
};

export const researchAgent = {
  getPrices,
  getPriceFromCache,
};
