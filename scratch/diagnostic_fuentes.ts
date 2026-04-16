import { FUENTES_PRECIO } from '../data/fuentes_comparativas';
import * as fs from 'fs';
import * as path from 'path';

async function testFuente(fuente: any, material: string = 'ladrillo') {
  const url = fuente.buscar(material);
  console.log(`\n=== ${fuente.nombre} ===`);
  console.log(`URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
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
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ HTTP error`);
      return;
    }
    
    const html = await response.text();
    console.log(`HTML size: ${html.length} chars`);
    
    // Guardar para inspección
    const filename = `debug_${fuente.nombre.replace(/\s+/g, '_')}.html`;
    fs.writeFileSync(path.join(__dirname, '..', filename), html);
    console.log(`Saved to ${filename}`);
    
    // Búsqueda de precios con métodos simples
    const patterns = [
      /\$\s*[\d.,]+/g,
      /ARS\s*[\d.,]+/g,
      /"price":\s*[\d.,]+/g,
      /"price":\s*"\$[\d.,]+"/g,
      /class="[^"]*price[^"]*"/gi,
      /data-price="[\d.,]+"/g,
      /content="\$[\d.,]+"/g,
    ];
    
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`Pattern ${pattern}: ${matches.length} matches`);
        // Mostrar primeros 3 únicos
        const unique = [...new Set(matches)].slice(0, 3);
        unique.forEach(m => console.log(`  - ${m}`));
      }
    }
    
    // Buscar ladrillo en el HTML
    const ladrilloIndex = html.toLowerCase().indexOf('ladrillo');
    if (ladrilloIndex !== -1) {
      const snippet = html.substring(Math.max(0, ladrilloIndex - 100), Math.min(html.length, ladrilloIndex + 100));
      console.log(`Snippet around "ladrillo": ...${snippet}...`);
    }
    
    // Contar ocurrencias de "product" o "item"
    const productCount = (html.match(/product/gi) || []).length;
    const itemCount = (html.match(/item/gi) || []).length;
    console.log(`Palabra "product": ${productCount}, "item": ${itemCount}`);
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('Diagnóstico de fuentes de precios');
  
  const fuentesHabilitadas = FUENTES_PRECIO.filter(f => f.enabled);
  console.log(`Fuentes habilitadas: ${fuentesHabilitadas.length}`);
  
  for (const fuente of fuentesHabilitadas) {
    await testFuente(fuente);
    // Esperar un poco entre requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);