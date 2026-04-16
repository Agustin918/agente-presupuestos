import { researchAgent } from '../agents/research_agent';
import { synthesisAgent } from '../agents/synthesis_agent';
import { excelGenerator } from '../output/excel_generator';
import { Blueprint, Presupuesto } from '../blueprint/schema';
import { getMaterialesDelBlueprint } from '../agents/orchestrator';

async function test() {
  console.log('=== Pipeline completo: Casa 250 m² ===\n');
  
  // Crear blueprint de ejemplo
  const blueprint: Blueprint = {
    id: 'test-' + Date.now(),
    version: 1,
    usuario_id: 'usuario_test',
    estudio_id: 'estudio_test',
    fecha_creacion: new Date().toISOString().split('T')[0],
    escenarios: true,
    
    nombre_obra: 'Casa ejemplo 250 m²',
    ubicacion: 'Escobar, Buenos Aires',
    superficie_cubierta_m2: 250,
    superficie_semicubierta_m2: 50, // galería semicubierta
    plantas: 2,
    tiene_planos: 'aprobados',
    
    dormitorios: 3,
    cantidad_banos: 2,
    tiene_cochera: true,
    tipo_cochera: 'cubierta',
    tiene_quincho: false,
    tiene_galeria: true,
    tiene_deck: true,
    superficie_deck_m2: 30,
    cocina_equipada: true,
    
    estructura: 'hormigon_armado',
    cubierta: 'chapa_trapezoidal',
    tiene_escalera: true,
    tipo_escalera: 'hormigon',
    
    categoria: 'estandar',
    factor_terminacion: 1.35,
    pisos: 'porcelanato',
    cielorraso: 'suspendido',
    aberturas: 'aluminio_dvh',
    
    revestimiento_exterior: 'revoque_fino',
    porton_cerco: true,
    material_cerco: 'metalico',
    
    instalaciones: ['electrica', 'sanitaria', 'gas', 'aire_acondicionado'],
    calentador_agua: 'termotanque_gas',
    tiene_cisterna: true,
    tiene_tanque_elevado: true,
    
    terreno: {
      tipo: 'lote_propio',
      desnivel_metros: 0.5,
      zona_inundable: false,
      restricciones_altura: 9,
      requiere_demolicion: false,
    },
    
    plazo_meses: 12,
    modalidad: 'llave_en_mano',
    observaciones: 'Presupuesto de prueba para casa de 250 m² cubiertos + 50 m² semicubiertos.',
  };
  
  console.log('1. Obteniendo precios de materiales...');
  const materiales = getMaterialesDelBlueprint(blueprint);
  console.log(`   Materiales a buscar (${materiales.length}):`);
  materiales.slice(0, 10).forEach((mat, i) => console.log(`     ${i+1}. ${mat}`));
  if (materiales.length > 10) console.log(`     ... y ${materiales.length - 10} más`);
  
  let precios;
  try {
    precios = await researchAgent.getPrices(materiales, blueprint.ubicacion);
    console.log(`   ${Object.keys(precios).length} precios obtenidos`);
    // Mostrar primeros 5 precios para diagnóstico
    let count = 0;
    for (const [mat, precioObj] of Object.entries(precios)) {
      if (count++ >= 5) break;
      console.log(`     ${mat}: ${precioObj.precio} ${precioObj.unidad} (${precioObj.fuente_url})`);
    }
  } catch (e) {
    console.error('   Error obteniendo precios:', e);
    // Usar precios mock para continuar
    precios = {};
  }
  
  console.log('\n2. Generando presupuesto...');
  let presupuesto: Presupuesto | undefined;
  try {
    presupuesto = await synthesisAgent.generarPresupuesto(blueprint, precios);
    console.log(`   Total estimado: ${presupuesto!.divisa} ${presupuesto!.total_estimado.toLocaleString('es-AR')}`);
    console.log(`   Costo por m²: ${presupuesto!.divisa} ${presupuesto!.costo_m2.toLocaleString('es-AR')}`);
    console.log(`   Items generados: ${presupuesto!.items.length}`);
    if (presupuesto!.validacion_tecnica?.mensajes?.length) {
      console.log(`   Validación técnica:`);
      presupuesto!.validacion_tecnica.mensajes.forEach(m => console.log(`    - ${m}`));
    }
    // Mostrar primeros 5 items para diagnóstico
    console.log(`   Detalle de 5 items:`);
    presupuesto!.items.slice(0, 5).forEach((item, i) => {
      console.log(`    ${i+1}. ${item.rubro}: ${item.cantidad} ${item.unidad} x ${item.precio_unitario} ${presupuesto!.divisa} = ${item.subtotal} ${presupuesto!.divisa} (${item.confianza}, fuente: ${item.fuente})`);
    });
  } catch (e) {
    console.error('   Error generando presupuesto:', e);
    return;
  }
  
  console.log('\n3. Generando comparativo...');
  let comparativo;
  try {
    comparativo = await synthesisAgent.generarPresupuestoComparativo(blueprint);
    console.log(`   Escenarios: ${comparativo.escenarios.length}`);
  } catch (e) {
    console.error('   Error generando comparativo:', e);
    comparativo = undefined;
  }
  
  console.log('\n4. Generando archivo Excel...');
  try {
    const rutaExcel = await excelGenerator.generarExcel(
      presupuesto,
      `presupuesto_${blueprint.nombre_obra.replace(/\s+/g, '_')}`,
      comparativo,
      { rutaSalida: './output' }
    );
    console.log(`   ✅ Excel generado: ${rutaExcel}`);
  } catch (e) {
    console.error('   Error generando Excel:', e);
  }
  
  console.log('\n=== Pipeline completado ===');
}

test().catch(console.error);