import { chromium } from 'playwright';

async function testScrape() {
  console.log('=== PRUEBA DE SCRAPING REAL EN MERCADOLIBRE ===\n');
  
  const materiales = [
    'ladrillo hueco 18x18x33',
    'cemento portland 50kg',
    'arena gruesa m3',
    'hormigon h21 m3',
    'hierro 8mm barra 12m',
    'chapa trapezoidal',
    'porcelanato 60x60',
    'ventana aluminio dvh',
    'pintura latex 20l',
    'inodoro suspendido'
  ];
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    console.log('Navegador lanzado\n');
    
    for (const material of materiales) {
      console.log(`\n--- Buscando: ${material} ---`);
      
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      
      const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(material)}`;
      console.log(`URL: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('Página cargada');
        
        // Esperar selectores
        await page.waitForSelector('.andes-money-amount__fraction, [data-testid="price"], .ui-search-result', { timeout: 10000 });
        
        // Extraer precios múltiples métodos
        const precios: number[] = [];
        
        // Método 1: .andes-money-amount__fraction
        const fractionElements = await page.$$('.andes-money-amount__fraction');
        for (const element of fractionElements) {
          const text = await element.textContent();
          if (text) {
            const cleaned = text.replace(/\./g, '').replace(',', '.');
            const precio = parseFloat(cleaned);
            if (!isNaN(precio) && precio > 0 && precio < 10000000) {
              precios.push(precio);
            }
          }
        }
        
        // Método 2: [data-testid="price"]
        const priceElements = await page.$$('[data-testid="price"], [data-testid="price-amount"]');
        for (const element of priceElements) {
          const text = await element.textContent();
          if (text) {
            const match = text.match(/(\d[\d.,]*)/);
            if (match) {
              const cleaned = match[1].replace(/\./g, '').replace(',', '.');
              const precio = parseFloat(cleaned);
              if (!isNaN(precio) && precio > 0 && precio < 10000000) {
                precios.push(precio);
              }
            }
          }
        }
        
        console.log(`Precios encontrados: ${precios.length}`);
        
        if (precios.length > 0) {
          // Filtrar outliers
          precios.sort((a, b) => a - b);
          const median = precios[Math.floor(precios.length / 2)];
          const filtered = precios.filter(p => p >= median * 0.1 && p <= median * 10);
          
          console.log(`Todos los precios: ${precios.slice(0, 10).join(', ')}...`);
          console.log(`Mediana: $${median} ARS`);
          console.log(`Filtrados (sin outliers): ${filtered.length} precios`);
          
          if (filtered.length > 0) {
            const mejorPrecio = Math.min(...filtered);
            const promedio = filtered.reduce((a, b) => a + b, 0) / filtered.length;
            
            console.log(`Mejor precio: $${mejorPrecio} ARS`);
            console.log(`Precio promedio: $${promedio.toFixed(0)} ARS`);
            
            // Convertir a USD (tasa ~1800 ARS/USD)
            const tasa = 1800;
            console.log(`Mejor precio en USD: $${(mejorPrecio / tasa).toFixed(2)} USD`);
            console.log(`Promedio en USD: $${(promedio / tasa).toFixed(2)} USD`);
          } else {
            console.log('No hay precios válidos después de filtrar outliers');
          }
        } else {
          console.log('No se encontraron precios');
        }
        
      } catch (error: any) {
        console.log(`Error scrapeando ${material}:`, error.message);
      } finally {
        await page.close();
      }
      
      // Esperar entre búsquedas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nNavegador cerrado');
    }
  }
  
  console.log('\n=== PRUEBA COMPLETADA ===');
}

testScrape().catch(console.error);