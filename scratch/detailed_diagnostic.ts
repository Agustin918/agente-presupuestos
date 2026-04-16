import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface FuenteDiagnostico {
  nombre: string;
  urls: string[]; // Diferentes patrones a probar
  selectoresPrecio: string[];
  descripcion: string;
}

const FUENTES_DIAGNOSTICO: FuenteDiagnostico[] = [
  {
    nombre: 'Easy',
    descripcion: 'Tienda de materiales de construcción',
    urls: [
      'https://www.easy.com.ar/catalogsearch/result/?q=ladrillo',
      'https://www.easy.com.ar/search?q=ladrillo',
      'https://www.easy.com.ar/construccion/ladrillos',
      'https://www.easy.com.ar/productos/construccion/ladrillos',
    ],
    selectoresPrecio: [
      '.price .price__current',
      '.price',
      '[data-price-type="finalPrice"]',
      '.product-price',
      '.special-price',
      '.regular-price',
      '.price-box',
      '[data-product-price]',
      '.price-amount',
      '.andes-money-amount__fraction',
    ],
  },
  {
    nombre: 'La Pista 26',
    descripcion: 'Corralón de materiales',
    urls: [
      'https://www.lapistay26.com.ar/index.php?search=ladrillo&description=true',
      'https://www.lapistay26.com.ar/ladrillos',
      'https://www.lapistay26.com.ar/productos/ladrillos',
      'https://www.lapistay26.com.ar/categoria/ladrillos',
    ],
    selectoresPrecio: [
      '.price',
      '.product-price',
      '.precio',
      '[itemprop="price"]',
      '.price-tag',
      '.valor',
      '.costo',
      '.precio-actual',
      '.price-amount',
    ],
  },
  {
    nombre: 'Construnort',
    descripcion: 'Materiales de construcción',
    urls: [
      'https://www.construnort.com.ar/catalogsearch/result/?q=ladrillo',
      'https://www.construnort.com.ar/search?q=ladrillo',
      'https://www.construnort.com.ar/ladrillos',
      'https://www.construnort.com.ar/productos/ladrillos',
    ],
    selectoresPrecio: [
      '.price',
      '.product-price',
      '.precio',
      '[data-price-type="finalPrice"]',
      '.price-box',
      '.special-price',
      '.regular-price',
    ],
  },
  {
    nombre: 'Hauster Maderera',
    descripcion: 'Maderera y materiales',
    urls: [
      'https://hauster.com.ar/?s=ladrillo',
      'https://hauster.com.ar/producto/ladrillo',
      'https://hauster.com.ar/categoria-producto/ladrillos',
      'https://hauster.com.ar/product-category/ladrillos',
    ],
    selectoresPrecio: [
      '.price',
      '.woocommerce-Price-amount',
      '.product-price',
      '[itemprop="price"]',
      '.amount',
      '.woocommerce-variation-price',
      '.woocommerce-variation-price .amount',
      '.single_variation .price',
    ],
  },
  {
    nombre: 'Jaque Mate',
    descripcion: 'Materiales de construcción',
    urls: [
      'https://www.jaquemate.com.ar/catalogsearch/result/?q=ladrillo',
      'https://www.jaquemate.com.ar/search?q=ladrillo',
      'https://www.jaquemate.com.ar/ladrillos',
      'https://www.jaquemate.com.ar/construccion/ladrillos',
    ],
    selectoresPrecio: [
      '.price',
      '.product-price',
      '[data-price-type="finalPrice"]',
      '.price-box',
      '.special-price',
      '.regular-price',
    ],
  },
  {
    nombre: 'Edificor',
    descripcion: 'Materiales de construcción',
    urls: [
      'https://www.edificor.com.ar/catalogsearch/result/?q=ladrillo',
      'https://www.edificor.com.ar/search?q=ladrillo',
      'https://www.edificor.com.ar/ladrillos',
      'https://www.edificor.com.ar/construccion/ladrillos',
    ],
    selectoresPrecio: [
      '.price',
      '.product-price',
      '[data-price-type="finalPrice"]',
      '.price-box',
      '.special-price',
      '.regular-price',
    ],
  },
];

async function testFuente(fuente: FuenteDiagnostico) {
  console.log(`\n=== DIAGNÓSTICO ${fuente.nombre} ===`);
  console.log(`Descripción: ${fuente.descripcion}`);
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    
    for (let i = 0; i < fuente.urls.length; i++) {
      const url = fuente.urls[i];
      console.log(`\n--- Probando URL ${i + 1}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();
        console.log(`  Título: "${title}", URL actual: ${page.url()}`);
        
        // Tomar screenshot
        const screenshotPath = path.join(__dirname, `debug_${fuente.nombre.replace(/\s+/g, '_')}_${i}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`  Screenshot guardado: ${screenshotPath}`);
        
        // Guardar HTML
        const html = await page.content();
        const htmlPath = path.join(__dirname, `debug_${fuente.nombre.replace(/\s+/g, '_')}_${i}.html`);
        fs.writeFileSync(htmlPath, html);
        console.log(`  HTML guardado: ${htmlPath} (${html.length} chars)`);
        
        // Probar selectores de precio
        console.log(`  Probando ${fuente.selectoresPrecio.length} selectores...`);
        for (const selector of fuente.selectoresPrecio) {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`    ✅ ${selector}: ${elements.length} elementos`);
            // Mostrar texto de primeros 2 elementos
            for (let j = 0; j < Math.min(elements.length, 2); j++) {
              const text = await elements[j].textContent();
              console.log(`      [${j}] "${text?.trim()}"`);
            }
          }
        }
        
        // Buscar patrones comunes de precio en texto
        const bodyText = await page.textContent('body');
        const patterns = [
          /\$\s*[\d.,]+/g,
          /ARS\s*[\d.,]+/g,
          /precio\s*[\d.,]+/gi,
          /valor\s*[\d.,]+/gi,
          /costo\s*[\d.,]+/gi,
          /"price":\s*[\d.,]+/g,
          /"price":\s*"\$[\d.,]+"/g,
        ];
        
        for (const pattern of patterns) {
          const matches = bodyText?.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`    🔍 Patrón ${pattern}: ${matches.length} matches`);
            const unique = [...new Set(matches)].slice(0, 3);
            unique.forEach(m => console.log(`      "${m}"`));
          }
        }
        
        // Verificar si es página de búsqueda o de producto
        const searchIndicators = ['resultado', 'search', 'busqueda', 'encontró', 'productos'];
        const productIndicators = ['producto', 'detalle', 'comprar', 'carrito', 'añadir', 'agregar'];
        
        const textLower = bodyText?.toLowerCase() || '';
        const isSearchPage = searchIndicators.some(ind => textLower.includes(ind));
        const isProductPage = productIndicators.some(ind => textLower.includes(ind));
        
        console.log(`  Tipo página: ${isSearchPage ? 'Búsqueda' : ''}${isProductPage ? 'Producto' : ''}${!isSearchPage && !isProductPage ? 'Indeterminado' : ''}`);
        
        // Contar productos visibles
        const productElements = await page.$$('.product, .item, .product-item, .producto, [data-product]');
        console.log(`  Elementos de producto: ${productElements.length}`);
        
        // Si es página de búsqueda sin precios, intentar navegar al primer resultado
        if (isSearchPage && productElements.length > 0) {
          console.log(`  Intentando navegar al primer resultado...`);
          try {
            const firstProduct = productElements[0];
            const productLink = await firstProduct.$('a');
            if (productLink) {
              await productLink.click();
              await page.waitForLoadState('domcontentloaded');
              
              console.log(`  Navegado a producto: ${page.url()}`);
              
              // Probar selectores nuevamente en página de producto
              for (const selector of fuente.selectoresPrecio) {
                const prodElements = await page.$$(selector);
                if (prodElements.length > 0) {
                  console.log(`    🏷️ ${selector} en producto: ${prodElements.length} elementos`);
                  for (let j = 0; j < Math.min(prodElements.length, 2); j++) {
                    const text = await prodElements[j].textContent();
                    console.log(`      [${j}] "${text?.trim()}"`);
                  }
                }
              }
            }
          } catch (e) {
            console.log(`  Error navegando a producto: ${e}`);
          }
        }
        
      } catch (error: any) {
        console.log(`  ❌ Error cargando URL: ${error.message}`);
      }
      
      // Esperar entre requests
      if (i < fuente.urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
  } catch (error: any) {
    console.error(`Error general con ${fuente.nombre}: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.log('INICIANDO DIAGNÓSTICO DETALLADO DE FUENTES DE PRECIOS');
  console.log('====================================================');
  
  for (const fuente of FUENTES_DIAGNOSTICO) {
    await testFuente(fuente);
    console.log('\n' + '='.repeat(50));
    // Esperar entre fuentes para no saturar
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\nDIAGNÓSTICO COMPLETADO');
}

main().catch(console.error);