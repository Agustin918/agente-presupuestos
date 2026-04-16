import { Blueprint, ItemPresupuesto } from "../blueprint/schema";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, CURRENCY, TASA_CAMBIO_USD as DEFAULT_TASA } from "../config/settings";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

function getCategoria(blueprint: Blueprint): string {
  // Mapear las categorías del blueprint a las categorías de obra
  const map: Record<string, string> = {
    'albanileria': '04 - Albañilería Obra Gruesa',
    'steel_frame': '04 - Albañilería Obra Gruesa',
    'hormigon_armado': '03 - Estructura Resistente',
    'madera': '04 - Albañilería Obra Gruesa',
    'mixto': '04 - Albañilería Obra Gruesa'
  };
  return map[blueprint.estructura] || '04 - Albañilería Obra Gruesa';
}

export async function generateBudgetItems(
  blueprint: Blueprint,
  precios: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }>,
  obrasSimilares: any[]
): Promise<ItemPresupuesto[]> {
  const superficie = blueprint.superficie_cubierta_m2 + ((blueprint.superficie_semicubierta_m2 || 0) * 0.5);
  const factorTerminacion = blueprint.factor_terminacion || 1;
  const hoy = new Date().toISOString().split('T')[0];
  
  // 1. Plantilla de ítems base por categoría (sin referencias a blueprint en la definición)
  const itemsBase: { rubro: string; unidad: string; ratio: number; precioKey: string; catDefault: string; descDefault: string }[] = [
    { rubro: 'Excavación y nivelación', unidad: 'm3', ratio: 0.6, precioKey: 'excavacion', catDefault: '02 - Movimiento de Suelos', descDefault: 'Movimiento de suelos para fundaciones' },
    { rubro: 'Hormigón elaborado H21', unidad: 'm3', ratio: 0.22, precioKey: 'hormigon', catDefault: '03 - Estructura Resistente', descDefault: 'Hormigón estructural + Hierro' },
    { rubro: 'Acero de construcción', unidad: 'kg', ratio: 28, precioKey: 'hierro', catDefault: '03 - Estructura Resistente', descDefault: 'Hierro nervado para refuerzos' },
    { rubro: 'Albañilería de elevación', unidad: 'm2', ratio: 2.2, precioKey: 'ladrillo', catDefault: '04 - Albañilería Obra Gruesa', descDefault: 'Paredes y tabiques' },
    { rubro: 'Aislaciones (Capa/Azotado)', unidad: 'm2', ratio: 1.1, precioKey: 'aislacion', catDefault: '05 - Capas Aisladoras', descDefault: 'Barrera hidrófuga' },
    { rubro: 'Estructura Techo / Cubierta', unidad: 'm2', ratio: 1.1, precioKey: 'estructura_cubierta', catDefault: '06 - Cubiertas y Techos', descDefault: 'Estructura técnica' },
    { rubro: 'Cubierta terminada', unidad: 'm2', ratio: 1.1, precioKey: 'chapa', catDefault: '06 - Cubiertas y Techos', descDefault: 'Cubierta' },
    { rubro: 'Revoques Gruesos y Finos', unidad: 'm2', ratio: 4.5, precioKey: 'revoque', catDefault: '07 - Revestimientos y Revoques', descDefault: 'Mano de obra y materiales' },
    { rubro: 'Cielorrasos suspendidos', unidad: 'm2', ratio: 1.0, precioKey: 'cielorraso', catDefault: '08 - Cielorrasos', descDefault: 'Placas de yeso con estructura' },
    { rubro: 'Carpintería Exterior', unidad: 'm2', ratio: 0.22, precioKey: 'aluminio', catDefault: '09 - Carpintería Exterior', descDefault: 'Aberturas' },
    { rubro: 'Pisos y revestimientos', unidad: 'm2', ratio: 1.1, precioKey: 'porcelanato', catDefault: '11 - Pisos y Zócalos', descDefault: 'Pisos' },
    { rubro: 'Instalación Eléctrica', unidad: 'bocas', ratio: 0.8, precioKey: 'electrica', catDefault: '12 - Instalación Eléctrica', descDefault: 'Completa con tableros' },
    { rubro: 'Instalación Sanitaria/Agua', unidad: 'm2', ratio: 0.9, precioKey: 'sanitaria', catDefault: '13 - Instalación Sanitaria y Agua', descDefault: 'Distribución y desagües' },
    { rubro: 'Instalación de Gas', unidad: 'm2', ratio: 0.4, precioKey: 'gas', catDefault: '14 - Instalación de Gas', descDefault: 'Piping y artefactos' },
    { rubro: 'Sanitarios y Griferías', unidad: 'un', ratio: 0.12, precioKey: 'sanitarios', catDefault: '16 - Sanitarios y Grifería', descDefault: 'Juegos completos' },
    { rubro: 'Puertas de interior', unidad: 'un', ratio: 0.15, precioKey: 'puerta_interior', catDefault: '17 - Carpintería Interior (Puertas/Placards)', descDefault: 'Puertas placa premium' },
    { rubro: 'Frentes de Placard', unidad: 'un', ratio: 0.1, precioKey: 'placard', catDefault: '17 - Carpintería Interior (Puertas/Placards)', descDefault: 'Melamina y perfiles' },
    { rubro: 'Pintura Obra Completa', unidad: 'm2', ratio: 3.5, precioKey: 'pintura', catDefault: '18 - Pintura', descDefault: 'Látex y esmalte' },
  ];

  // TABLA DE PRECIOS REALES EN USD (Referencia: 71.5M ARS / 139m2 = ~515 USD/m2 - Sept 2025)
  // Inflación ~40% 2025-2026 -> ~720 USD/m2 base
  const preciosReferencia: Record<string, number> = {
    excavacion: 15,
    hormigon: 70,
    hierro: 0.8,
    ladrillo: 12,
    aislacion: 5,
    estructura_cubierta: 35,
    chapa: 18,
    revoque: 12,
    cielorraso: 15,
    aluminio: 180,
    porcelanato: 30,
    electrica: 40,
    sanitaria: 60,
    gas: 45,
    sanitarios: 350,
    puerta_interior: 150,
    placard: 250,
    pintura: 7,
  };

  const items: ItemPresupuesto[] = [];

  for (const base of itemsBase) {
    const cantidad = Math.round(superficie * base.ratio * 100) / 100;
    
    // Si tenemos precio de búsqueda (ya convertido a USD en Synthesis), lo usamos. 
    // Si no, usamos nuestra tabla de blindaje.
    const ref = precios[base.precioKey];
    let precioUnitario = ref ? ref.precio : preciosReferencia[base.precioKey];
    
    // Aplicar factor de calidad (solo a terminaciones)
    const rubrosConFactor = ['porcelanato', 'aluminio', 'sanitarios', 'puerta_interior', 'placard', 'pintura'];
    if (rubrosConFactor.includes(base.precioKey)) {
      precioUnitario *= factorTerminacion;
    }

    const subtotal = Math.round(cantidad * precioUnitario);

    items.push({
      rubro: base.rubro,
      descripcion: base.descDefault,
      unidad: base.unidad,
      cantidad: cantidad,
      precio_unitario: Math.round(precioUnitario),
      subtotal: subtotal,
      categoria: base.catDefault,
      fuente: ref ? 'Market Intel Agent' : 'Base Datos Estudios v6.1',
      fuente_url: ref ? ref.fuente_url : '',
      fecha_precio: ref ? ref.fecha : hoy,
      confianza: ref ? "alta" : "media",
      nota_confianza: ref ? '' : 'Dato paramétrico USD 2026',
      precio_desactualizado: false,
      razonamiento_ia: `Calculado para ${superficie}m2 con ratio técnico de ${base.ratio} ${base.unidad}/m2.`
    });
  }

  return items;
}

export const llmService = {
  generateBudgetItems,
  callAnthropic: async () => [],
};