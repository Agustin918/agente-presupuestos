import { extractPrice } from '../agents/scraper';

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.text();
}

async function testFuente(nombre: string, url: string) {
  console.log(`\n=== ${nombre} ===`);
  console.log(`URL: ${url}`);
  try {
    const html = await fetchHtml(url);
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    const precio = extractPrice(html, nombre);
    console.log(`Precio extraído: ${precio}`);
    
    // Buscar JSON-LD manualmente
    const jsonLdMatches = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      console.log(`Scripts JSON-LD encontrados: ${jsonLdMatches.length}`);
      for (let i = 0; i < Math.min(jsonLdMatches.length, 2); i++) {
        const match = jsonLdMatches[i];
        const jsonStr = match.replace(/<script[^>]*>|<\/script>/gi, '');
        if (jsonStr.includes('price')) {
          console.log(`JSON-LD ${i} contiene "price": ${jsonStr.substring(0, 200)}...`);
        }
      }
    }
    
    // Buscar patrones de precio
    const pricePatterns = [
      /\$\s*[\d.,]+/g,
      /"price":\s*[\d.,]+/g,
      /"price":\s*"\$[\d.,]+"/g,
    ];
    for (const pattern of pricePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`Patrón ${pattern}: ${matches.length} matches`);
        const unique = [...new Set(matches)].slice(0, 3);
        unique.forEach(m => console.log(`  "${m}"`));
      }
    }
    
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
}

async function main() {
  console.log('Test de extracción de precios con fuentes actualizadas');
  
  // Test Easy
  await testFuente('Easy', 'https://www.easy.com.ar/search?q=ladrillo');
  
  // Test Construnort (categoría ladrillos)
  await testFuente('Construnort', 'https://www.construnort.com.ar/ladrillos');
  
  // Test Jaque Mate
  await testFuente('Jaque Mate', 'https://www.jaquemate.com.ar/catalogsearch/result/?q=ladrillo');
  
  // Test La Pista 26
  await testFuente('La Pista 26', 'https://www.lapistay26.com.ar/index.php?search=ladrillo&description=true');
  
  // Esperar entre requests
  await new Promise(resolve => setTimeout(resolve, 3000));
}

main().catch(console.error);