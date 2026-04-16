import { chromium } from 'playwright';

async function testMercadoLibre() {
  let browser;
  try {
    console.log('Lanzando navegador...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    
    const material = 'ladrillo';
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(material)}`;
    console.log(`Navegando a ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Página cargada');
    
    // Tomar screenshot
    await page.screenshot({ path: 'scratch/mercado_libre.png' });
    console.log('Screenshot guardado');
    
    // Buscar precios
    const selectors = [
      '[data-testid="price"]',
      '[data-testid="price-amount"]',
      '.andes-money-amount__fraction',
      '.ui-search-price__part',
      '.ui-search-price__fraction',
      '.price-tag-fraction',
      '.price-tag',
      '[itemprop="price"]',
      '.andes-money-amount__part',
      '.ui-search-result__content .andes-money-amount__fraction'
    ];
    
    let precioText: string | null = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        const element = await page.$(selector);
        if (element) {
          precioText = await page.textContent(selector);
          if (precioText) {
            console.log(`Precio encontrado con selector ${selector}: ${precioText}`);
            break;
          }
        }
      } catch (e) {
        // selector no encontrado
      }
    }
    
    if (!precioText) {
      console.log('No se encontró precio con selectores, intentando extraer de JSON-LD');
      const jsonLd = await page.$$eval('script[type="application/ld+json"]', nodes => 
        nodes.map(n => n.textContent).filter(Boolean)
      );
      
      for (const jsonText of jsonLd) {
        try {
          const data = JSON.parse(jsonText);
          const price = extractPriceFromJson(data);
          if (price) {
            console.log(`Precio encontrado en JSON-LD: ${price}`);
            precioText = price.toString();
            break;
          }
        } catch (e) {}
      }
    }
    
    // Extraer números de la página
    if (!precioText) {
      const bodyText = await page.textContent('body');
      const priceMatches = bodyText?.match(/\$\s*[\d.,]+/g);
      if (priceMatches) {
        console.log('Posibles precios encontrados en texto:', priceMatches.slice(0, 5));
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }
}

function extractPriceFromJson(data: any): number | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const price = extractPriceFromJson(item);
      if (price) return price;
    }
    return null;
  }
  if (typeof data.price === 'number') return data.price;
  if (typeof data.price === 'string') {
    const num = parseFloat(data.price.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) return num;
  }
  if (data.offers) {
    return extractPriceFromJson(data.offers);
  }
  if (typeof data === 'object') {
    for (const key in data) {
      const price = extractPriceFromJson(data[key]);
      if (price) return price;
    }
  }
  return null;
}

testMercadoLibre().catch(console.error);