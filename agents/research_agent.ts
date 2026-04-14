import { PrecioCache } from "../blueprint/schema";
import { PRECIO_VIGENCIA_DIAS, PRECIO_MAX_ANTIGUEDAD_DIAS } from "../config/settings";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";
import { FUENTES_PRECIOS } from "../data/fuentes_precios";

const CACHE_PATH = "./data/cache/precios.json";

interface ResultadoPrecio {
  material: string;
  precio: number;
  unidad: string;
  fuente_url: string;
  fecha: string;
  vigencia_dias: number;
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

function estaVencido(fecha: string): boolean {
  const hoy = new Date().toISOString().split("T")[0];
  return diasDiff(fecha, hoy) > PRECIO_VIGENCIA_DIAS;
}

function estaExpirado(fecha: string): boolean {
  const hoy = new Date().toISOString().split("T")[0];
  return diasDiff(fecha, hoy) > PRECIO_MAX_ANTIGUEDAD_DIAS;
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
    fecha: entry.fecha,
    vigencia_dias: PRECIO_VIGENCIA_DIAS - dias,
  };
}

export async function searchPrice(material: string): Promise<ResultadoPrecio | null> {
  const cached = await getPriceFromCache(material);
  if (cached && !estaVencido(cached.fecha)) {
    return cached;
  }

  console.log(`[Research] Buscando precio para: ${material}`);
  
  // Intentar scraping con Playwright
  const resultado = await scrapePrice(material);
  if (resultado) {
    return {
      material,
      precio: resultado.precio,
      unidad: resultado.unidad,
      fuente_url: resultado.url,
      fecha: new Date().toISOString().split('T')[0],
      vigencia_dias: PRECIO_VIGENCIA_DIAS,
    };
  }
  
  return null;
}

async function scrapePrice(material: string): Promise<{ precio: number; unidad: string; url: string } | null> {
  // Implementación simple con Playwright
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    // Buscar en MercadoLibre
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(material)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Esperar resultados con timeout más corto
    try {
      await page.waitForSelector('div.ui-search-result__content', { timeout: 10000 });
    } catch {
      // Si no hay resultados, buscar otro selector
      await page.waitForSelector('span.andes-money-amount__fraction', { timeout: 5000 });
    }
    // Tomar primer resultado
    const precioText = await page.textContent('span.andes-money-amount__fraction');
    const unidadText = await page.textContent('span.andes-money-amount__currency-symbol') || 'ARS';
    if (precioText) {
      const precio = parseInt(precioText.replace(/\\./g, ''));
      return { precio, unidad: unidadText, url: searchUrl };
    }
  } catch (error) {
    console.error('[Scrape] Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Fallback: precio mock basado en material
  console.log(`[Scrape] Fallback a mock para ${material}`);
  const mockPrices: Record<string, number> = {
    ladrillo: 850,
    cemento: 4500,
    arena: 3200,
    chapa: 12500,
    'tornillo autoperforante': 120,
    ceramico: 2500,
    pegamento: 1800,
    'ventana aluminio': 28000,
    cable: 1500,
    techa: 8000,
    tablero: 9500,
    'caño pvp': 1200,
    grifería: 7500,
    'caño gas': 3500,
    regulador: 4200,
  };
  const precio = mockPrices[material.toLowerCase()] || 1000;
  return { precio, unidad: 'ARS', url: 'https://mock.precios.com' };
}

export async function getPrices(
  materiales: string[],
  ubicacion: string
): Promise<Record<string, ResultadoPrecio>> {
  const resultados: Record<string, ResultadoPrecio> = {};
  const cache = leerCache();

  for (const mat of materiales) {
    const cached = await getPriceFromCache(mat);

    if (cached && !estaVencido(cached.fecha)) {
      resultados[mat] = cached;
      continue;
    }

    if (cached && cached.vigencia_dias <= 0 && !estaExpirado(cached.fecha)) {
      resultados[mat] = { ...cached, vigencia_dias: 0 };
      if (!cache[mat]) cache[mat] = {} as any;
      cache[mat].precio_desactualizado = true;
      continue;
    }

    if (cached && estaExpirado(cached.fecha)) {
      console.log(`[Research] Precio expirado para ${mat}, buscando nuevo...`);
    }

    const nuevo = await searchPrice(mat);
    if (nuevo) {
      resultados[mat] = nuevo;
      cache[mat] = {
        precio: nuevo.precio,
        unidad: nuevo.unidad,
        fuente_url: nuevo.fuente_url,
        fecha: nuevo.fecha,
        vigente: true,
      };
    } else if (cached) {
      resultados[mat] = cached;
      if (!cache[mat]) cache[mat] = {} as any;
      cache[mat].precio_desactualizado = true;
    }
  }

  guardarCache(cache);

  const frescos = Object.values(resultados).filter((r) => r.vigencia_dias > 0).length;
  const cacheado = Object.keys(resultados).length - frescos;
  console.log(`[Research] Precios: ${frescos} frescos, ${cacheado} del cache`);

  return resultados;
}

export const researchAgent = {
  getPrices,
  getPriceFromCache,
};