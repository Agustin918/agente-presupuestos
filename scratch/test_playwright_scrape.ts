import { scrapeAllSources } from '../agents/scraper';
import { getFuentesHabilitadas } from '../data/fuentes_comparativas';

async function test() {
  console.log('=== Test de scraping mejorado con Playwright ===\n');
  
  const material = 'ladrillo';
  const fuentes = getFuentesHabilitadas();
  console.log(`Fuentes habilitadas: ${fuentes.map(f => f.nombre).join(', ')}`);
  
  console.log(`\nBuscando "${material}"...`);
  
  const resultados = await scrapeAllSources(material, fuentes);
  
  console.log(`\nResultados obtenidos: ${resultados.length}`);
  resultados.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.fuente}: $${r.precio} ARS (${r.unidad}) - ${r.url}`);
  });
  
  if (resultados.length === 0) {
    console.log('\n⚠️  No se obtuvieron resultados. Verificar conexión o selectores.');
  } else {
    console.log('\n✅ Scraping exitoso.');
  }
}

test().catch(console.error);