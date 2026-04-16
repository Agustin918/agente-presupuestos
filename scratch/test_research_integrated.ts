import { researchAgent } from '../agents/research_agent';

async function test() {
  console.log('=== Test Research Agent integrado ===\n');
  
  const materiales = ['ladrillo', 'cemento', 'arena', 'chapa'];
  const ubicacion = 'Escobar, Buenos Aires';
  
  console.log(`Materiales: ${materiales.join(', ')}`);
  console.log(`Ubicación: ${ubicacion}\n`);
  
  const precios = await researchAgent.getPrices(materiales, ubicacion);
  
  console.log('Resultados:');
  Object.entries(precios).forEach(([material, info]) => {
    console.log(`  ${material}: $${info.precio} ARS (${info.vigencia_dias > 0 ? `vigente ${info.vigencia_dias}d` : 'cache'}) - ${info.fuente_url}`);
  });
  
  const frescos = Object.values(precios).filter(p => p.vigencia_dias > 0).length;
  console.log(`\nResumen: ${frescos} precios frescos, ${materiales.length - frescos} del caché.`);
}

test().catch(console.error);