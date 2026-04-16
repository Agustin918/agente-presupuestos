import { researchAgent } from '../agents/research_agent';

async function testPriceSearch() {
  console.log('=== PRUEBA DE BÚSQUEDA DE PRECIOS ===');
  
  const materiales = [
    'ladrillo hueco 18',
    'cemento portland',
    'arena gruesa',
    'hormigón H21',
    'chapa trapezoidal',
    'ventana aluminio DVH',
    'porcelanato 60x60',
    'pintura latex',
    'instalación eléctrica',
    'instalación sanitaria',
    'aire acondicionado split',
    'inodoro y bidet',
    'cielorraso suspendido',
    'puerta interior madera',
    'placard empotrado',
    'calefacción radiante',
    'cocina equipada',
    'vanitory mármol',
    'portón metálico',
    'deck de madera'
  ];
  
  console.log(`Buscando precios para ${materiales.length} materiales...`);
  
  try {
    const resultados = await researchAgent.getPrices(materiales, 'Buenos Aires');
    
    console.log(`\n=== RESULTADOS OBTENIDOS ===`);
    let frescos = 0;
    let cacheados = 0;
    let desactualizados = 0;
    
    for (const [material, resultado] of Object.entries(resultados)) {
      const estado = resultado.vigencia_dias > 0 ? 'FRESCO' : resultado.vigencia_dias === 0 ? 'CACHE (vigente)' : 'DESACTUALIZADO';
      if (resultado.vigencia_dias > 0) frescos++;
      else if (resultado.vigencia_dias === 0) cacheados++;
      else desactualizados++;
      
      console.log(`\n${material}:`);
      console.log(`  Precio: $${resultado.precio} ${resultado.unidad}`);
      console.log(`  Fuente: ${resultado.fuente_url}`);
      console.log(`  Fecha: ${resultado.fecha} (${resultado.vigencia_dias} días de vigencia)`);
      console.log(`  Estado: ${estado}`);
    }
    
    console.log(`\n=== ESTADÍSTICAS ===`);
    console.log(`Materiales totales: ${materiales.length}`);
    console.log(`Precios frescos: ${frescos}`);
    console.log(`Precios del caché (vigentes): ${cacheados}`);
    console.log(`Precios desactualizados: ${desactualizados}`);
    
    // Verificar que todos los materiales tengan precio
    const materialesSinPrecio = materiales.filter(m => !resultados[m]);
    if (materialesSinPrecio.length > 0) {
      console.log(`\n⚠️  Materiales sin precio:`, materialesSinPrecio);
    } else {
      console.log(`\n✅ Todos los materiales tienen precio asignado`);
    }
    
  } catch (error) {
    console.error('Error en la búsqueda de precios:', error);
  }
}

// Ejecutar prueba
if (require.main === module) {
  testPriceSearch().catch(console.error);
}

export { testPriceSearch };