import { FuentePrecio, FUENTES_PRECIO } from "../data/fuentes_comparativas";
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface PrecioExtraido {
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
  console.log(`[Scrape] Resultados después del loop: ${resultados.length}`);

  // Para desarrollo: si no hay resultados, generar datos de prueba
  // Comentado para permitir fallback a MercadoLibre
  // if (resultados.length === 0) {
  //   console.log('[Scrape] Usando datos de prueba para razonamiento humano');
  //   return generateMockResults(material, sources);
  // }

  return resultados;
}

function generateMockResults(material: string, sources: FuentePrecio[]): PrecioExtraido[] {
  const mockPrecios: Record<string, number> = {
    'ladrillo': 850,
    'cemento': 4500,
    'arena': 3200,
    'chapa': 12500,
    'tornillo autoperforante': 120,
    'ceramico': 2500,
    'porcelanato': 3500,
    'hierro': 800,
    'madera': 12000,
  };
  
  const precioBase = mockPrecios[material.toLowerCase()] || 1000;
  const resultados: PrecioExtraido[] = [];
  
  // Generar precios ligeramente diferentes para cada fuente
  sources.filter(f => f.enabled).forEach((fuente, index) => {
    // Variación +/- 20%
    const variacion = 0.8 + (Math.random() * 0.4);
    const precio = Math.round(precioBase * variacion);
    resultados.push({
      fuente: fuente.nombre,
      precio,
      unidad: 'ARS',
      url: fuente.buscar(material),
      fecha: new Date().toISOString().split('T')[0],
    });
  });
  
  // También agregar un outlier extremo para probar detección
  if (resultados.length > 2) {
    resultados[1].precio = Math.round(precioBase * 3); // outlier alto
  }
  
  console.log(`[Scrape] Mock generado ${resultados.length} precios para ${material}`);
  return resultados;
}

async function scrapeSingleSource(
  material: string,
  fuente: FuentePrecio
): Promise<PrecioExtraido | null> {
  const url = fuente.buscar(material);
  console.log(`[Scrape] Intentando fuente ${fuente.nombre}: ${url}`);
  
  // Si la fuente requiere Playwright, usar directamente
  if (fuente.requiresPlaywright) {
    console.log(`[Scrape] Fuente ${fuente.nombre} requiere Playwright, usando navegación...`);
    return await scrapeWithPlaywright(material, fuente);
  }
  
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Scrape] Intento ${attempt} de ${maxAttempts} (fetch)`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Referer': 'https://www.google.com/',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.log(`[Scrape] HTTP ${response.status} para ${fuente.nombre}`);
        continue;
      }

      const html = await response.text();
      console.log(`[Scrape] HTML obtenido (${html.length} chars) de ${fuente.nombre}`);
      
      const precio = extractPrice(html, fuente.nombre);
      console.log(`[Scrape] Precio extraído: ${precio} de ${fuente.nombre}`);
      
      if (precio && precio > 100 && precio < 5000000) {
        console.log(`[Scrape] ✅ Precio válido $${precio} de ${fuente.nombre}`);
        return {
          fuente: fuente.nombre,
          precio,
          unidad: 'ARS',
          url,
          fecha: new Date().toISOString().split('T')[0],
        };
      } else {
        console.log(`[Scrape] ❌ Precio fuera de rango o no encontrado: ${precio}`);
      }
    } catch (e) {
      console.log(`[Scrape] Error en intento ${attempt} para ${fuente.nombre}:`, e instanceof Error ? e.message : e);
    }
    
    // Esperar un poco antes de reintentar (solo si no es el último intento)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Si fetch falló, intentar con Playwright como fallback (solo si no lo intentamos ya)
  console.log(`[Scrape] Fetch falló para ${fuente.nombre}, intentando con Playwright...`);
  return await scrapeWithPlaywright(material, fuente);
}

export function extractPrice(html: string, fuenteNombre: string): number | null {
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

  // 1. Búsqueda con patrones regex tradicionales
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

  // 2. Búsqueda en JSON-LD (schema.org)
  const jsonLdRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(jsonLdMatch[1]);
      const price = extractPriceFromJson(json);
      if (price) precios.push(price);
    } catch (e) {
      // JSON inválido, continuar
    }
  }

  // 3. Búsqueda en meta tags (og:price, product:price)
  const metaPriceRegex = /<meta[^>]*(property|name)=["'](og:price|product:price|price)["'][^>]*content=["']([^"']+)["']/gi;
  let metaMatch;
  while ((metaMatch = metaPriceRegex.exec(html)) !== null) {
    const priceStr = metaMatch[3].replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(priceStr);
    if (price > 100 && price < 5000000) precios.push(price);
  }

  // 4. Búsqueda en scripts con datos WooCommerce
  const wcDataRegex = /data-product_variations=["']([^"']+)["']|"price":"(\d+(?:\.\d+)?)"/gi;
  let wcMatch;
  while ((wcMatch = wcDataRegex.exec(html)) !== null) {
    const jsonStr = wcMatch[1] || `{"price":${wcMatch[2]}}`;
    try {
      const data = JSON.parse(jsonStr);
      const price = extractPriceFromJson(data);
      if (price) precios.push(price);
    } catch (e) {
      // intentar extraer número directamente
      const numMatch = jsonStr.match(/"price":\s*(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const price = parseFloat(numMatch[1]);
        if (price > 100 && price < 5000000) precios.push(price);
      }
    }
  }

  // 5. Búsqueda de números que parezcan precios en ARS (formato $ 1.234,56)
  const arsPriceRegex = /\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
  let arsMatch;
  while ((arsMatch = arsPriceRegex.exec(html)) !== null) {
    const priceStr = arsMatch[1].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(priceStr);
    if (price > 100 && price < 5000000) precios.push(price);
  }

  if (precios.length === 0) return null;

  // Filtrar outliers usando IQR (rango intercuartílico)
  precios.sort((a, b) => a - b);
  const q1 = precios[Math.floor(precios.length * 0.25)];
  const q3 = precios[Math.floor(precios.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const preciosFiltrados = precios.filter(p => p >= lowerBound && p <= upperBound);
  
  // Si después de filtrar queda vacío, usar todos los precios
  const preciosFinales = preciosFiltrados.length > 0 ? preciosFiltrados : precios;
  
  // Para presupuestos, seleccionar el precio más bajo (mejor oportunidad)
  // pero asegurarnos que no sea extremadamente bajo (menor al percentil 10)
  const minReasonable = preciosFinales[Math.floor(preciosFinales.length * 0.1)];
  const preciosRazonables = preciosFinales.filter(p => p >= minReasonable);
  
  // Seleccionar el más bajo de los razonables
  const selected = preciosRazonables.length > 0 ? Math.min(...preciosRazonables) : preciosFinales[0];
  
  console.log(`[extractPrice] ${precios.length} precios encontrados, ${preciosFiltrados.length} después de filtrar outliers, seleccionado: $${selected}`);
  
  return selected;
}

/**
 * Función avanzada para extraer el precio de un material desde un contenido Markdown 
 * usando heurística y regex. En producción, esto podría usar un LLM pequeño.
 */
export function extractPriceFromMarkdown(markdown: string, material: string): number | null {
  console.log(`[DeepScrape] Intentando extraer precio para "${material}" de contenido markdown...`);
  
  // 1. Limpiar markdown para facilitar búsqueda
  const simpleMd = markdown.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // quitar links
  
  // 2. Buscar bloques que mencionen el material
  const lines = simpleMd.split('\n');
  const relevantLines = lines.filter(l => l.toLowerCase().includes(material.toLowerCase()));
  
  if (relevantLines.length > 0) {
    console.log(`[DeepScrape] Encontradas ${relevantLines.length} líneas relevantes`);
    for (const line of relevantLines) {
      const price = extractPrice(line, 'default');
      if (price) return price;
    }
  }
  
  // 3. Fallback a búsqueda global en el markdown
  return extractPrice(simpleMd, 'default');
}

function extractPriceFromJson(data: any): number | null {
  if (!data) return null;
  
  // Si es array, iterar
  if (Array.isArray(data)) {
    for (const item of data) {
      const price = extractPriceFromJson(item);
      if (price) return price;
    }
    return null;
  }
  
  // Si tiene propiedad price
  if (typeof data.price === 'number') return data.price;
  if (typeof data.price === 'string') {
    const num = parseFloat(data.price.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) return num;
  }
  
  // Si tiene offers (schema.org)
  if (data.offers) {
    const offerPrice = extractPriceFromJson(data.offers);
    if (offerPrice) return offerPrice;
  }
  
  // Si es objeto, buscar recursivamente
  if (typeof data === 'object') {
    for (const key in data) {
      const price = extractPriceFromJson(data[key]);
      if (price) return price;
    }
  }
  
  return null;
}

async function scrapeWithPlaywright(
  material: string,
  fuente: FuentePrecio
): Promise<PrecioExtraido | null> {
  const url = fuente.buscar(material);
  console.log(`[Scrape Playwright] Navegando a ${fuente.nombre}: ${url}`);
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Directorio para debug
    const debugDir = path.join(__dirname, '../debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    
    // Navegar con timeout generoso
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(`[Scrape Playwright] Página cargada: ${page.url()}`);
    
    // Esperar a que cargue contenido dinámico
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Obtener HTML y extraer precios con extractPrice
    const html = await page.content();
    
    // DEBUG: Guardar HTML inicial
    const debugFile = path.join(debugDir, `debug_${fuente.nombre.replace(/\s+/g, '_')}_initial_${Date.now()}.html`);
    fs.writeFileSync(debugFile, html);
    console.log(`[Scrape Playwright] HTML inicial guardado en ${debugFile}`);
    
    const precioExtraido = extractPrice(html, fuente.nombre);
    
    if (precioExtraido && precioExtraido > 100 && precioExtraido < 5000000) {
      console.log(`[Scrape Playwright] ✅ Precio extraído directamente: $${precioExtraido}`);
      return {
        fuente: fuente.nombre,
        precio: precioExtraido,
        unidad: 'ARS',
        url: page.url(),
        fecha: new Date().toISOString().split('T')[0],
      };
    }
    
    // Si no se encontró precio directamente, buscar productos y navegar al primero
    console.log(`[Scrape Playwright] No se encontró precio directamente, buscando productos...`);
    
    // Buscar enlaces de productos comunes
    const productSelectors = [
      '.product a', '.item a', '.product-item a', '.producto a', 
      '[data-product] a', '.card a', '.box a', '.list-item a',
      'a.product', 'a.item', 'a.producto'
    ];
    
    let productLink = null;
    for (const selector of productSelectors) {
      const links = await page.$$(selector);
      if (links.length > 0) {
        productLink = links[0];
        console.log(`[Scrape Playwright] Encontrado enlace de producto con selector: ${selector}`);
        break;
      }
    }
    
    // Si no hay enlaces específicos, buscar cualquier enlace que contenga "producto" o "item"
    if (!productLink) {
      const allLinks = await page.$$('a');
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && (href.includes('product') || href.includes('item') || 
                     (text && text.toLowerCase().includes('product')))) {
          productLink = link;
          break;
        }
      }
    }
    
    if (productLink) {
      console.log(`[Scrape Playwright] Navegando al producto...`);
      await productLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Esperar carga dinámica
      
      const productHtml = await page.content();
      
      // DEBUG: Guardar HTML para análisis
      const debugFile = path.join(debugDir, `debug_${fuente.nombre.replace(/\s+/g, '_')}_product_${Date.now()}.html`);
      fs.writeFileSync(debugFile, productHtml);
      console.log(`[Scrape Playwright] HTML de producto guardado en ${debugFile}`);
      
      const productPrice = extractPrice(productHtml, fuente.nombre);
      
      if (productPrice && productPrice > 100 && productPrice < 5000000) {
        console.log(`[Scrape Playwright] ✅ Precio en producto: $${productPrice}`);
        return {
          fuente: fuente.nombre,
          precio: productPrice,
          unidad: 'ARS',
          url: page.url(),
          fecha: new Date().toISOString().split('T')[0],
        };
      }
    }
    
    // Último intento: buscar cualquier número que parezca precio en la página
    console.log(`[Scrape Playwright] Buscando precios con selectores CSS...`);
    const priceSelectors = [
      fuente.selectorPrecio,
      '.price', '.product-price', '.precio', '[itemprop="price"]',
      '.price-tag', '.valor', '.costo', '.precio-actual',
      '.amount', '.woocommerce-Price-amount'
    ];
    
    const uniqueSelectors = [...new Set(priceSelectors.filter(s => s))];
    for (const selector of uniqueSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`[Scrape Playwright] Selector ${selector}: ${elements.length} elementos`);
        // Tomar el primer elemento y extraer texto
        const text = await elements[0].textContent();
        if (text) {
          // Extraer número del texto
          const match = text.match(/(\d[\d.,]*)/);
          if (match) {
            const cleaned = match[1].replace(/\./g, '').replace(',', '.');
            const price = parseFloat(cleaned);
            if (!isNaN(price) && price > 100 && price < 5000000) {
              console.log(`[Scrape Playwright] ✅ Precio encontrado via selector: $${price}`);
              return {
                fuente: fuente.nombre,
                precio: price,
                unidad: 'ARS',
                url: page.url(),
                fecha: new Date().toISOString().split('T')[0],
              };
            }
          }
        }
      }
    }
    
    // DEBUG: Guardar HTML final antes de fallar
    const finalHtml = await page.content();
    const finalDebugFile = path.join(debugDir, `debug_${fuente.nombre.replace(/\s+/g, '_')}_final_${Date.now()}.html`);
    fs.writeFileSync(finalDebugFile, finalHtml);
    console.log(`[Scrape Playwright] HTML final guardado en ${finalDebugFile}`);
    
    console.log(`[Scrape Playwright] ❌ No se pudo extraer precio para ${material} de ${fuente.nombre}`);
    return null;
    
  } catch (error: any) {
    console.error(`[Scrape Playwright] Error para ${fuente.nombre}:`, error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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
