import { ObraHistorica } from '../blueprint/schema';
import { vectorStore } from '../rag/store';
import * as fs from 'fs';
import * as path from 'path';

// Precios base por material (ARS) - valores realistas 2026
const PRECIOS_BASE: Record<string, number> = {
  ladrillo: 850,
  cemento: 4500,
  arena: 3200,
  chapa: 12500,
  tornillo_autoperforante: 120,
  ceramico: 2500,
  porcelanato: 3500,
  hierro: 800,
  madera: 12000,
  cal: 1800,
  'caño_pvc': 1200,
  cable: 1500,
  griferia: 7500,
  pintura: 5000,
  'ventana_aluminio': 28000,
  'puerta_madera': 45000,
  'teja_ceramica': 8000,
  'aislante_termico': 3000,
  'membrana_asfaltica': 4500,
  'durlock': 1500,
  'montante_acero': 2500,
  'yeso': 800,
  'clavo': 50,
  'tornillo': 30,
  'tarugo': 10,
};

// Ubicaciones con factores regionales
const UBICACIONES = [
  { ciudad: 'Buenos Aires', factor: 1.0 },
  { ciudad: 'Córdoba', factor: 0.95 },
  { ciudad: 'Rosario', factor: 0.92 },
  { ciudad: 'Mendoza', factor: 0.98 },
  { ciudad: 'Tucumán', factor: 0.9 },
  { ciudad: 'Salta', factor: 0.88 },
  { ciudad: 'Mar del Plata', factor: 1.05 },
  { ciudad: 'Neuquén', factor: 1.05 },
  { ciudad: 'Bahía Blanca', factor: 0.97 },
  { ciudad: 'La Plata', factor: 1.02 },
];

// Sistemas constructivos
const ESTRUCTURAS = ['albanileria', 'steel_frame', 'hormigon_armado', 'madera', 'mixto'];

// Categorías de terminación
const CATEGORIAS = ['economico', 'estandar', 'premium', 'lujo'];

// Generar obra histórica
function generarObra(id: number): ObraHistorica {
  const ubicacion = UBICACIONES[Math.floor(Math.random() * UBICACIONES.length)];
  const estructura = ESTRUCTURAS[Math.floor(Math.random() * ESTRUCTURAS.length)];
  const categoria = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
  const superficie = 80 + Math.random() * 200; // 80-280 m2
  const factorCategoria = { economico: 1.0, estandar: 1.35, premium: 1.8, lujo: 2.5 }[categoria] || 1.0;
  
  // Generar ratios de precios aplicando factor regional y de categoría
  const ratios: Record<string, number> = {};
  for (const [material, precioBase] of Object.entries(PRECIOS_BASE)) {
    // Variación +/- 20%
    const variacion = 0.8 + Math.random() * 0.4;
    let precio = precioBase * variacion * ubicacion.factor * factorCategoria;
    // Redondear a múltiplo de 50
    precio = Math.round(precio / 50) * 50;
    ratios[material] = precio;
  }
  
  // Agregar ratios específicos por sistema constructivo
  if (estructura === 'steel_frame') {
    ratios.montante_acero = 2500 * ubicacion.factor * factorCategoria;
    ratios.durlock = 1500 * ubicacion.factor * factorCategoria;
    ratios.tornillo_autoperforante = 120 * ubicacion.factor * factorCategoria;
  }
  
  // Desvío estimado vs real (-10% a +15%)
  const desvio = -10 + Math.random() * 25;
  
  return {
    id: `hist_${id.toString().padStart(3, '0')}`,
    nombre: `Casa ejemplo ${ubicacion.ciudad} ${estructura} ${categoria}`,
    fecha_cierre: `202${5 + Math.floor(Math.random() * 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    estudio_id: 'estudio_001',
    estructura,
    superficie_m2: Math.round(superficie),
    categoria,
    ubicacion: ubicacion.ciudad,
    ratios,
    desvio_estimado_real: parseFloat(desvio.toFixed(1)),
    observaciones: `Obra generada automáticamente para pruebas. Sistema ${estructura}, ${categoria}, ${Math.round(superficie)} m².`,
  };
}

async function main() {
  console.log('Generando dataset histórico de obras...');
  const obras: ObraHistorica[] = [];
  const count = 50;
  
  for (let i = 1; i <= count; i++) {
    const obra = generarObra(i);
    obras.push(obra);
    console.log(`Generada obra ${i}: ${obra.nombre}`);
  }
  
  // Guardar en archivo JSON para inspección
  const outputPath = path.join(__dirname, '..', 'data', 'historico', 'generated_obras.json');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(obras, null, 2));
  console.log(`\nGuardadas ${obras.length} obras en ${outputPath}`);
  
  // Ingresar al vector store
  console.log('\nIngresando obras al vector store...');
  for (const obra of obras) {
    await vectorStore.addObra(obra);
  }
  
  // Verificar cantidad
  const todasObras = await vectorStore.getObras();
  console.log(`Total obras en store: ${todasObras.length}`);
  
  // Ejemplo de búsqueda
  console.log('\nEjemplo de búsqueda para ladrillo:');
  const obrasLadrillo = await vectorStore.searchObras('ladrillo');
  console.log(`Obras con ladrillo: ${obrasLadrillo.length}`);
  if (obrasLadrillo.length > 0) {
    const ratios = obrasLadrillo[0].ratios;
    console.log('Ratios de primera obra:', Object.entries(ratios).slice(0, 5));
  }
}

main().catch(console.error);