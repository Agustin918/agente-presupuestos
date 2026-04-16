import { researchAgent } from './agents/research_agent';

async function test() {
  console.log('Probando Research Agent con razonamiento humano...');
  
  const materiales = ['ladrillo'];
  const ubicacion = 'Buenos Aires';
  
  console.log(`Materiales: ${materiales.join(', ')}`);
  console.log(`Ubicación: ${ubicacion}`);
  
  try {
    const resultados = await researchAgent.getPrices(materiales, ubicacion);
    
    console.log('\nResultados obtenidos:');
    for (const [material, info] of Object.entries(resultados)) {
      console.log(`\n${material}:`);
      console.log(`  Precio: $${info.precio} ${info.unidad}`);
      console.log(`  Fuente: ${info.fuente_url}`);
      console.log(`  Fecha: ${info.fecha}`);
      console.log(`  Vigencia días: ${info.vigencia_dias}`);
    }
    
    const frescos = Object.values(resultados).filter(r => r.vigencia_dias > 0).length;
    const cacheados = Object.values(resultados).length - frescos;
    console.log(`\nResumen: ${frescos} precios frescos, ${cacheados} del caché`);
    
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

test();