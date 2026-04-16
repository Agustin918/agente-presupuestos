import * as fs from 'fs';
import * as path from 'path';

// Copia de la función extractPrice del scraper
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

  // Devolver el precio más frecuente (mediana) o el más alto (estrategia conservadora)
  // Para presupuestos usamos un precio medio-alto para no subestimar
  precios.sort((a, b) => a - b);
  const median = precios[Math.floor(precios.length / 2)];
  
  return median;
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

async function main() {
  console.log('=== Test extractPrice ===');
  
  // Leer HTML guardados
  const hausterHtml = fs.readFileSync(path.join(__dirname, '../hauster.html'), 'utf-8');
  const lapistaHtml = fs.readFileSync(path.join(__dirname, '../lapista.html'), 'utf-8');
  
  console.log('\n--- Hauster Maderera ---');
  const precioHauster = extractPrice(hausterHtml, 'Hauster Maderera');
  console.log('Precio extraído:', precioHauster);
  
  console.log('\n--- La Pista 26 ---');
  const precioLapista = extractPrice(lapistaHtml, 'La Pista 26');
  console.log('Precio extraído:', precioLapista);
  
  // También buscar patrones de precio manualmente
  console.log('\n--- Búsqueda manual de patrones ---');
  const patrones = [/\$\s*[\d.,]+/g, /ARS\s*[\d.,]+/g, /"price":\s*[\d.,]+/g];
  for (const patron of patrones) {
    const matches = hausterHtml.match(patron);
    if (matches) console.log(`Patrón ${patron}:`, matches.slice(0, 5));
  }
  
  // Buscar texto "ladrillo" y contexto
  const ladrilloIndex = hausterHtml.indexOf('ladrillo');
  if (ladrilloIndex !== -1) {
    const contexto = hausterHtml.substring(Math.max(0, ladrilloIndex - 200), Math.min(hausterHtml.length, ladrilloIndex + 200));
    console.log('\nContexto "ladrillo":', contexto);
  }
}

main().catch(console.error);