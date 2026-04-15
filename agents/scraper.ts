import { FuentePrecio, FUENTES_PRECIO } from "../data/fuentes_comparativas";

interface PrecioExtraido {
  fuente: string;
  precio: number;
  unidad: string;
  url: string;
  fecha: string;
}

export async function scrapeAllSources(
  material: string,
  sources: FuentePrecio[]
): Promise<PrecioExtraido[]> {
  const resultados: PrecioExtraido[] = [];

  for (const fuente of sources) {
    if (!fuente.enabled) continue;
    
    try {
      const precio = await scrapeSingleSource(material, fuente);
      if (precio) {
        resultados.push(precio);
      }
    } catch (e) {
      // Continuar con siguiente fuente
    }
  }

  return resultados;
}

async function scrapeSingleSource(
  material: string,
  fuente: FuentePrecio
): Promise<PrecioExtraido | null> {
  const url = fuente.buscar(material);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    
    const precio = extractPrice(html, fuente.nombre);
    
    if (precio && precio > 100 && precio < 5000000) {
      return {
        fuente: fuente.nombre,
        precio,
        unidad: 'ARS',
        url,
        fecha: new Date().toISOString().split('T')[0],
      };
    }
  } catch (e) {
    // Timeout o error de red
  }

  return null;
}

function extractPrice(html: string, fuenteNombre: string): number | null {
  // Patrones específicos por fuente para precios realistas en ARS
  const patterns: { [key: string]: RegExp[] } = {
    'Easy': [
      /\$\s*([\d.]{4,10})\s*(?:ARS|\.)/gi,
      /price["\s:]+([\d.]{4,10})/gi,
      /"price":\s*([\d.]{4,10})/gi,
    ],
    'La Pista 26': [
      /\$([\d.]{3,10})\s*pesos/gi,
      /ARS\s*\$?\s*([\d.]{3,10})/gi,
    ],
    'Construnort': [
      /\$\s*([\d.]{4,10})/gi,
      /price["\s:]+([\d.]{4,10})/gi,
    ],
    'Hauster Maderera': [
      /\$([\d.]{3,10})/gi,
    ],
    'Jaque Mate': [
      /\$\s*([\d.]{4,10})/gi,
      /price["\s:]+([\d.]{4,10})/gi,
    ],
    'Edificor': [
      /\$([\d.]{4,10})/gi,
    ],
    'default': [
      /\$\s*([\d.]{4,10})/gi,
      /ARS\s*([\d.]{3,10})/gi,
      /"price":\s*([\d.]{4,10})/gi,
    ],
  };

  const sourcePatterns = patterns[fuenteNombre] || patterns['default'];
  const precios: number[] = [];

  for (const pattern of sourcePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const precioStr = match[1].replace(/\./g, '').replace(/,/g, '.');
      const precio = parseFloat(precioStr);
      if (precio > 100 && precio < 5000000) {
        precios.push(precio);
      }
    }
    pattern.lastIndex = 0; // Reset regex
  }

  if (precios.length === 0) return null;

  // Devolver el precio más frecuente (mediana) o el más alto (estrategia conservadora)
  // Para presupuestos usamos un precio medio-alto para no subestimar
  precios.sort((a, b) => a - b);
  const median = precios[Math.floor(precios.length / 2)];
  
  return median;
}

export function selectBestPrice(resultados: PrecioExtraido[]): PrecioExtraido {
  if (resultados.length === 0) {
    throw new Error('No hay precios disponibles');
  }

  // Ordenar por precio
  resultados.sort((a, b) => a.precio - b.precio);

  // Devolver el más barato (mejor oportunidad)
  return resultados[0];
}

export function calculateStats(resultados: PrecioExtraido[]): {
  mejor: PrecioExtraido;
  peor: PrecioExtraido;
  promedio: number;
  mediana: number;
  ahorro: number;
} {
  const precios = resultados.map(r => r.precio).sort((a, b) => a - b);
  const sum = precios.reduce((a, b) => a + b, 0);
  const avg = sum / precios.length;
  const median = precios[Math.floor(precios.length / 2)];
  
  return {
    mejor: resultados.find(r => r.precio === precios[0])!,
    peor: resultados.find(r => r.precio === precios[precios.length - 1])!,
    promedio: Math.round(avg),
    mediana: median,
    ahorro: precios[precios.length - 1] - precios[0],
  };
}
