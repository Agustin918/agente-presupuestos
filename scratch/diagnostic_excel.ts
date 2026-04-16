import { synthesisAgent } from '../agents/synthesis_agent';
import { excelGenerator } from '../output/excel_generator';
import { Blueprint } from '../blueprint/schema';

async function diagnostic() {
  console.log('=== DIAGNÓSTICO EXCEL - PRECIOS REALISTAS ===\n');
  
  // Blueprint válido con todos los campos requeridos
  const blueprint: Blueprint = {
    id: 'diagnostic-' + Date.now(),
    version: 1,
    usuario_id: 'usuario_test',
    estudio_id: 'estudio_test',
    fecha_creacion: new Date().toISOString().split('T')[0],
    escenarios: false,
    
    // Campos de extracción (opcionales)
    archivos_fuente: [],
    confianza_extraccion: {},
    escala_detectada: '1:100',
    metodo_extraccion: 'manual',
    
    nombre_obra: 'Casa diagnóstico 220 m²',
    ubicacion: 'Buenos Aires',
    superficie_cubierta_m2: 220,
    superficie_semicubierta_m2: 30,
    plantas: 2,
    tiene_planos: 'aprobados',
    
    dormitorios: 3,
    cantidad_banos: 2,
    tiene_cochera: true,
    tipo_cochera: 'cubierta',
    tiene_quincho: false,
    tiene_galeria: true,
    tiene_deck: true,
    superficie_deck_m2: 20,
    cocina_equipada: true,
    
    estructura: 'albanileria',
    cubierta: 'chapa_trapezoidal',
    tiene_escalera: true,
    tipo_escalera: 'hormigon',
    
    categoria: 'premium',
    factor_terminacion: 1.8,
    pisos: 'porcelanato',
    cielorraso: 'suspendido',
    aberturas: 'aluminio_dvh',
    
    revestimiento_exterior: 'revoque_fino',
    porton_cerco: true,
    material_cerco: 'metalico',
    
    instalaciones: ['electrica', 'sanitaria', 'gas', 'aire_acondicionado', 'calefaccion_radiante'],
    calentador_agua: 'termotanque_gas',
    tiene_cisterna: false,
    tiene_tanque_elevado: true,
    
    terreno: {
      tipo: 'lote_propio',
      desnivel_metros: 0.5,
      zona_inundable: false,
      restricciones_altura: 9,
      requiere_demolicion: false,
    },
    
    plazo_meses: 10,
    modalidad: 'llave_en_mano',
    observaciones: 'Prueba de diagnóstico Excel',
    especificaciones_tecnicas: ['Calidad premium', 'Aberturas DVH', 'Porcelanato 60x60'],
    
    detalle_constructivo: {
      ladrillo_tipo: 'hueco_18',
      ladrillo_espesor_cm: 18,
      fundacion_tipo: 'platea',
      fundacion_espesor_cm: 25,
      fundacion_aislacion: true,
      entrepiso_tipo: 'viguetas_telgopor',
      cubierta_aislacion_termica: 'lana de vidrio',
      cubierta_membrana: 'asfaltica',
    },
  };
  
  console.log('Blueprint creado:', blueprint.nombre_obra);
  console.log('Superficie:', blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0), 'm²');
  console.log('Categoría:', blueprint.categoria, 'Factor:', blueprint.factor_terminacion);
  
  // PRECIOS REALES EN ARS (Abril 2026) - Basados en precios reales de mercado
  const preciosReales: Record<string, any> = {
    // Materiales básicos (precios por unidad en ARS)
    'ladrillo': { precio: 850, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/ladrillo-hueco-18x18x33', fecha: new Date().toISOString().split('T')[0] },
    'cemento': { precio: 4500, unidad: 'bolsa', fuente_url: 'https://listado.mercadolibre.com.ar/cemento-portland-50kg', fecha: new Date().toISOString().split('T')[0] },
    'arena': { precio: 3200, unidad: 'm3', fuente_url: 'https://listado.mercadolibre.com.ar/arena-gruesa-m3', fecha: new Date().toISOString().split('T')[0] },
    'hormigon': { precio: 80000, unidad: 'm3', fuente_url: 'https://listado.mercadolibre.com.ar/hormigon-h21-m3', fecha: new Date().toISOString().split('T')[0] },
    'hierro 8mm': { precio: 11000, unidad: 'barra', fuente_url: 'https://listado.mercadolibre.com.ar/hierro-8mm-barra-12m', fecha: new Date().toISOString().split('T')[0] },
    'hierro 6mm': { precio: 8000, unidad: 'barra', fuente_url: 'https://listado.mercadolibre.com.ar/hierro-6mm-barra-12m', fecha: new Date().toISOString().split('T')[0] },
    'acero': { precio: 450, unidad: 'kg', fuente_url: 'https://listado.mercadolibre.com.ar/acero-construction', fecha: new Date().toISOString().split('T')[0] },
    'bloque': { precio: 1500, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/bloque-hormigon', fecha: new Date().toISOString().split('T')[0] },
    
    // Excavación y movimiento de suelos
    'excavacion': { precio: 15000, unidad: 'm3', fuente_url: 'https://listado.mercadolibre.com.ar/excavacion-m3', fecha: new Date().toISOString().split('T')[0] },
    'movimiento de suelos': { precio: 18000, unidad: 'm3', fuente_url: 'https://listado.mercadolibre.com.ar/movimiento-suelos-m3', fecha: new Date().toISOString().split('T')[0] },
    
    // Cubierta
    'chapa trapezoidal': { precio: 12500, unidad: 'plancha', fuente_url: 'https://listado.mercadolibre.com.ar/chapa-trapezoidal', fecha: new Date().toISOString().split('T')[0] },
    'tornillo autoperforante': { precio: 120, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/tornillo-autoperforante', fecha: new Date().toISOString().split('T')[0] },
    'estructura cubierta': { precio: 20000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/estructura-cubierta-metalica', fecha: new Date().toISOString().split('T')[0] },
    'perfil metalico': { precio: 25000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/perfil-metalico', fecha: new Date().toISOString().split('T')[0] },
    
    // Pisos
    'porcelanato': { precio: 6500, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/porcelanato-60x60', fecha: new Date().toISOString().split('T')[0] },
    'pegamento porcelanato': { precio: 1800, unidad: 'bolsa', fuente_url: 'https://listado.mercadolibre.com.ar/pegamento-porcelanato', fecha: new Date().toISOString().split('T')[0] },
    
    // Aberturas y vidrios
    'ventana aluminio': { precio: 85000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/ventana-aluminio-dvh', fecha: new Date().toISOString().split('T')[0] },
    'perfil aluminio': { precio: 50000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/perfil-aluminio', fecha: new Date().toISOString().split('T')[0] },
    'vidrio dvh': { precio: 30000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/vidrio-dvh', fecha: new Date().toISOString().split('T')[0] },
    'cristal': { precio: 25000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/cristal', fecha: new Date().toISOString().split('T')[0] },
    
    // Revestimientos y pintura
    'revoque fino': { precio: 8000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/revoque-fino', fecha: new Date().toISOString().split('T')[0] },
    'revoque grueso': { precio: 6000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/revoque-grueso', fecha: new Date().toISOString().split('T')[0] },
    'pintura latex': { precio: 12000, unidad: '20l', fuente_url: 'https://listado.mercadolibre.com.ar/pintura-latex-20l', fecha: new Date().toISOString().split('T')[0] },
    'pintura esmalte': { precio: 15000, unidad: '20l', fuente_url: 'https://listado.mercadolibre.com.ar/pintura-esmalte-20l', fecha: new Date().toISOString().split('T')[0] },
    
    // Cielorraso
    'cielorraso suspendido': { precio: 12000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/cielorraso-suspendido', fecha: new Date().toISOString().split('T')[0] },
    'durlock': { precio: 13000, unidad: 'plancha', fuente_url: 'https://listado.mercadolibre.com.ar/durlock', fecha: new Date().toISOString().split('T')[0] },
    'yeso': { precio: 800, unidad: 'kg', fuente_url: 'https://listado.mercadolibre.com.ar/yeso', fecha: new Date().toISOString().split('T')[0] },
    
    // Carpintería interior
    'puerta interior': { precio: 40000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/puerta-interior', fecha: new Date().toISOString().split('T')[0] },
    'placard': { precio: 25000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/placard', fecha: new Date().toISOString().split('T')[0] },
    'ropero': { precio: 30000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/ropero', fecha: new Date().toISOString().split('T')[0] },
    'mueble cocina': { precio: 150000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/mueble-cocina', fecha: new Date().toISOString().split('T')[0] },
    
    // Instalaciones
    'cable electrico': { precio: 1800, unidad: '100m', fuente_url: 'https://listado.mercadolibre.com.ar/cable-electrico', fecha: new Date().toISOString().split('T')[0] },
    'tablero electrico': { precio: 25000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/tablero-electrico', fecha: new Date().toISOString().split('T')[0] },
    'llave termica': { precio: 5000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/llave-termica', fecha: new Date().toISOString().split('T')[0] },
    'spot led': { precio: 15000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/spot-led', fecha: new Date().toISOString().split('T')[0] },
    'caño pvc': { precio: 1200, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/caño-pvc', fecha: new Date().toISOString().split('T')[0] },
    'caño cloaca': { precio: 2000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/caño-cloaca', fecha: new Date().toISOString().split('T')[0] },
    'griferia': { precio: 25000, unidad: 'juego', fuente_url: 'https://listado.mercadolibre.com.ar/griferia', fecha: new Date().toISOString().split('T')[0] },
    'inodoro': { precio: 65000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/inodoro', fecha: new Date().toISOString().split('T')[0] },
    'bidet': { precio: 35000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/bidet', fecha: new Date().toISOString().split('T')[0] },
    'ducha': { precio: 45000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/ducha', fecha: new Date().toISOString().split('T')[0] },
    'caño gas': { precio: 3500, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/caño-gas', fecha: new Date().toISOString().split('T')[0] },
    'regulador gas': { precio: 4200, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/regulador-gas', fecha: new Date().toISOString().split('T')[0] },
    'llave gas': { precio: 1500, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/llave-gas', fecha: new Date().toISOString().split('T')[0] },
    'aire acondicionado split': { precio: 300000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/aire-acondicionado-split', fecha: new Date().toISOString().split('T')[0] },
    'climatizacion': { precio: 250000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/climatizacion', fecha: new Date().toISOString().split('T')[0] },
    'split inverter': { precio: 350000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/split-inverter', fecha: new Date().toISOString().split('T')[0] },
    'calefaccion radiante': { precio: 18000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/calefaccion-radiante', fecha: new Date().toISOString().split('T')[0] },
    'radiador': { precio: 45000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/radiador', fecha: new Date().toISOString().split('T')[0] },
    'caldera': { precio: 120000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/caldera', fecha: new Date().toISOString().split('T')[0] },
    
    // Sanitarios y grifería
    'sanitario': { precio: 80000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/sanitario', fecha: new Date().toISOString().split('T')[0] },
    'griferia cocina': { precio: 30000, unidad: 'juego', fuente_url: 'https://listado.mercadolibre.com.ar/griferia-cocina', fecha: new Date().toISOString().split('T')[0] },
    'griferia baño': { precio: 25000, unidad: 'juego', fuente_url: 'https://listado.mercadolibre.com.ar/griferia-baño', fecha: new Date().toISOString().split('T')[0] },
    
    // Calentador
    'termotanque gas': { precio: 80000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/termotanque-gas', fecha: new Date().toISOString().split('T')[0] },
    
    // Equipamiento
    'cocina equipada': { precio: 150000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/cocina-equipada', fecha: new Date().toISOString().split('T')[0] },
    'mesada': { precio: 45000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/mesada', fecha: new Date().toISOString().split('T')[0] },
    'bajo mesada': { precio: 60000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/bajo-mesada', fecha: new Date().toISOString().split('T')[0] },
    'vanitory': { precio: 80000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/vanitory', fecha: new Date().toISOString().split('T')[0] },
    'mueble baño': { precio: 50000, unidad: 'un', fuente_url: 'https://listado.mercadolibre.com.ar/mueble-baño', fecha: new Date().toISOString().split('T')[0] },
    
    // Exteriores
    'porton metalico': { precio: 20000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/porton-metalico', fecha: new Date().toISOString().split('T')[0] },
    'cerco metalico': { precio: 15000, unidad: 'ml', fuente_url: 'https://listado.mercadolibre.com.ar/cerco-metalico', fecha: new Date().toISOString().split('T')[0] },
    'deck madera': { precio: 15000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/deck-madera', fecha: new Date().toISOString().split('T')[0] },
    'entablonado exterior': { precio: 12000, unidad: 'm2', fuente_url: 'https://listado.mercadolibre.com.ar/entablonado-exterior', fecha: new Date().toISOString().split('T')[0] },
  };
  
  console.log('\n=== GENERANDO PRESUPUESTO CON PRECIOS REALISTAS ===');
  console.log('Total de precios simulados:', Object.keys(preciosReales).length);
  
  // Generar presupuesto (pasar precios manualmente)
  const presupuesto = await synthesisAgent.generarPresupuesto(blueprint, preciosReales);
  
  console.log('\n=== RESULTADO DEL PRESUPUESTO ===');
  console.log('Total estimado:', presupuesto.total_estimado, presupuesto.divisa);
  console.log('Costo por m²:', presupuesto.costo_m2, presupuesto.divisa + '/m²');
  console.log('Superficie:', presupuesto.superficie_m2, 'm²');
  console.log('Items generados:', presupuesto.items.length);
  console.log('Precios frescos:', presupuesto.precios_frescos);
  console.log('Precios del caché:', presupuesto.precios_cache);
  console.log('Validación técnica:', presupuesto.validacion_tecnica?.resultado || 'No disponible');
  
  // Mostrar algunos items de ejemplo
  console.log('\n=== EJEMPLO DE ITEMS (primeros 5) ===');
  presupuesto.items.slice(0, 5).forEach(item => {
    console.log(`- ${item.rubro}: ${item.cantidad} ${item.unidad} x ${item.precio_unitario} ${presupuesto.divisa} = ${item.subtotal} ${presupuesto.divisa}`);
    console.log(`  Categoría: ${item.categoria}, Confianza: ${item.confianza}, Fuente: ${item.fuente}`);
  });
  
  // Calcular totales por categoría
  const porCategoria = presupuesto.items.reduce((acc, item) => {
    const cat = item.categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += item.subtotal;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n=== DISTRIBUCIÓN POR CATEGORÍA ===');
  Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).forEach(([cat, total]) => {
    const porcentaje = ((total / presupuesto.total_estimado) * 100).toFixed(1);
    console.log(`${cat}: ${total.toLocaleString()} ${presupuesto.divisa} (${porcentaje}%)`);
  });
  
  // Verificar si el costo por m² es razonable
  const costoM2 = presupuesto.costo_m2;
  const rangoRazonable = { min: 1300, max: 2200 }; // USD/m² para categoría premium (rango realista)
  console.log('\n=== VALIDACIÓN DE COSTO POR M² ===');
  console.log(`Costo calculado: ${costoM2} ${presupuesto.divisa}/m²`);
  console.log(`Rango razonable para categoría ${blueprint.categoria}: ${rangoRazonable.min} - ${rangoRazonable.max} ${presupuesto.divisa}/m²`);
  if (costoM2 >= rangoRazonable.min && costoM2 <= rangoRazonable.max) {
    console.log('✅ Costo por m² dentro del rango razonable');
  } else {
    console.log('⚠️  Costo por m² fuera del rango razonable');
  }
  
  // Generar Excel
  console.log('\n=== GENERANDO EXCEL ===');
  const rutaExcel = await excelGenerator.generarExcel(presupuesto, 'diagnostico_premium');
  console.log('Excel generado en:', rutaExcel);
  
  console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
  console.log('Revisa el archivo Excel generado para verificar formato y datos.');
}

diagnostic().catch(error => {
  console.error('Error en diagnóstico:', error);
  process.exit(1);
});