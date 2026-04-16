import { chromium } from 'playwright';

async function debugMercadoLibre() {
  let browser;
  try {
    console.log('Lanzando navegador...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    
    const material = 'ladrillo';
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(material)}`;
    console.log(`Navegando a ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Página cargada');
    
    // Tomar screenshot
    await page.screenshot({ path: 'scratch/mercado_libre_debug.png', fullPage: true });
    console.log('Screenshot guardado');
    
    // Guardar HTML
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('scratch/mercado_libre.html', html);
    console.log('HTML guardado, tamaño:', html.length);
    
    // Buscar elementos de precio
    const priceSelectors = [
      '[data-testid="price"]',
      '[data-testid="price-amount"]',
      '.andes-money-amount__fraction',
      '.ui-search-price__part',
      '.ui-search-price__fraction',
      '.price-tag-fraction',
      '.price-tag',
      '[itemprop="price"]',
      '.andes-money-amount__part',
      '.ui-search-result__content .andes-money-amount__fraction',
      'span.price-tag-text-sr-only',
      'span.andes-money-amount__currency-symbol',
    ];
    
    for (const selector of priceSelectors) {
      const elements = await page.$$(selector);
      console.log(`Selector ${selector}: ${elements.length} elementos`);
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          console.log(`  [${i}] ${text}`);
        }
      }
    }
    
    // Buscar en JSON-LD
    const jsonLdScripts = await page.$$('script[type="application/ld+json"]');
    console.log(`Scripts JSON-LD: ${jsonLdScripts.length}`);
    for (let i = 0; i < jsonLdScripts.length; i++) {
      const content = await jsonLdScripts[i].textContent();
      if (content && content.includes('price')) {
        console.log(`JSON-LD ${i}: ${content.substring(0, 200)}...`);
      }
    }
    
    // Extraer todos los números que parezcan precios
    const bodyText = await page.textContent('body');
    const priceMatches = bodyText?.match(/\$\s*[\d.,]+/g);
    if (priceMatches) {
      console.log('Posibles precios encontrados ($):', priceMatches.slice(0, 10));
    }
    const arsMatches = bodyText?.match(/ARS\s*[\d.,]+/g);
    if (arsMatches) {
      console.log('Posibles precios encontrados (ARS):', arsMatches.slice(0, 10));
    }
    
    // Verificar si hay resultados de búsqueda
    const results = await page.$$('.ui-search-result');
    console.log(`Resultados de búsqueda (clase .ui-search-result): ${results.length}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) await browser.close();
  }
}

debugMercadoLibre().catch(console.error);