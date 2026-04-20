import { Blueprint, ItemPresupuesto } from "../blueprint/schema";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, CURRENCY, TASA_CAMBIO_USD as DEFAULT_TASA } from "../config/settings";
import { buscarLinkCompra } from "../data/links_compras";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

function getCategoria(blueprint: Blueprint): string {
  const map: Record<string, string> = {
    'albanileria': '04 - Mampostería',
    'steel_frame': '04 - Mampostería',
    'hormigon_armado': '03 - Estructura Resistente de HºAº',
    'madera': '04 - Mampostería',
    'mixto': '04 - Mampostería'
  };
  return map[blueprint.estructura] || '04 - Mampostería';
}

export async function generateBudgetItems(
  blueprint: Blueprint,
  precios: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }>,
  obrasSimilares: any[]
): Promise<ItemPresupuesto[]> {
  const superficie = blueprint.superficie_cubierta_m2 + ((blueprint.superficie_semicubierta_m2 || 0) * 0.5);
  const factorTerminacion = blueprint.factor_terminacion || 1;
  const hoy = new Date().toISOString().split('T')[0];
  
const itemsBase: { 
    item: number;
    rubro: string; 
    unidad: string; 
    ratio: number; 
    precioKey: string; 
    catDefault: string; 
    descDefault: string;
    desglose: string;
  }[] = [
    { item: 1, rubro: '1.1 - Limpieza del terreno', unidad: 'm2', ratio: 1.0, precioKey: 'limpieza', catDefault: '01 - Trabajos Preliminares', descDefault: 'Limpieza y desmalezado del terreno', desglose: 'Limpieza general, removal de escombros superficiales' },
    { item: 1, rubro: '1.2 - Replanteo', unidad: 'm2', ratio: 1.0, precioKey: 'replanteo', catDefault: '01 - Trabajos Preliminares', descDefault: 'Replanteo de obra', desglose: 'Marcación de ejes, niveles y linderos según plano' },
    { item: 1, rubro: '1.3 - Cartel de obra', unidad: 'un', ratio: 1.0, precioKey: 'cartel', catDefault: '01 - Trabajos Preliminares', descDefault: 'Cartel de obra', desglose: 'Cartel de obra 2.00x1.00m con datos de obra y profesional' },
    { item: 2, rubro: '2.1 - Excavación de zanjas', unidad: 'm3', ratio: 0.6, precioKey: 'excavacion', catDefault: '02 - Movimiento de Tierra', descDefault: 'Excavación para fundaciones', desglose: 'Excavación de zanjas para zapatas y vigas de fundación. Profundidad según estudio de suelo' },
    { item: 2, rubro: '2.2 - Relleno y compactación', unidad: 'm3', ratio: 0.4, precioKey: 'relleno', catDefault: '02 - Movimiento de Tierra', descDefault: 'Relleno y compactación', desglose: 'Relleno con material granular, compactación por capas' },
    { item: 3, rubro: '3.1 - Zapata de fundación', unidad: 'm3', ratio: 0.12, precioKey: 'hormigon_fundacion', catDefault: '03 - Estructura Resistente de HºAº', descDefault: 'Hormigonado de Zapata', desglose: 'Hormigon H21 para Zapata de fundación. Acero: hierros 10, 12 y 6mm' },
    { item: 3, rubro: '3.2 - Vigas de fundación', unidad: 'm3', ratio: 0.08, precioKey: 'viga_fundacion', catDefault: '03 - Estructura Resistente de HºAº', descDefault: 'Vigas de encadenado', desglose: 'Vigas de fundación. Acero y encofrado' },
    { item: 3, rubro: '3.3 - Columnas y pilares', unidad: 'm3', ratio: 0.1, precioKey: 'columna', catDefault: '03 - Estructura Resistente de HºAº', descDefault: 'Columnas de elevación', desglose: 'Columnas de hormigón armado. Acero y encofrado' },
    { item: 3, rubro: '3.4 - Encadenado horizontal', unidad: 'm', ratio: 0.5, precioKey: 'encadenado', catDefault: '03 - Estructura Resistente de HºAº', descDefault: 'Encadenados horizontales', desglose: 'Encadenado perimetral. Acero y encofrado' },
    { item: 4, rubro: '4.1 - Muro elevación 20cm', unidad: 'm2', ratio: 2.2, precioKey: 'ladrillo', catDefault: '04 - Mampostería', descDefault: 'Muro de elevación 20cm', desglose: 'Ladrillo o bloque visto/bloques. Mortero de asentamiento BV y BH. Altura libre: 2.40m' },
    { item: 4, rubro: '4.2 - Muro divisor 12cm', unidad: 'm2', ratio: 1.2, precioKey: 'ladrillo_12', catDefault: '04 - Mampostería', descDefault: 'Tabique divisor 12cm', desglose: 'Ladrillo o bloque para tabiques interiores' },
    { item: 5, rubro: '5.1 - barrera hidrófuga', unidad: 'm2', ratio: 1.0, precioKey: 'hidrofugo', catDefault: '05 - Capas Aisladoras', descDefault: 'Impermeabilización de muros', desglose: 'Hidrofugo en muros perimetrales (1ra altura mínima 1m)' },
    { item: 5, rubro: '5.2 - Aislación térmica', unidad: 'm2', ratio: 1.0, precioKey: 'aislante', catDefault: '05 - Capas Aisladoras', descDefault: 'Aislación término-acústica', desglose: 'Lana de vidrio o EPS bajo cubierta' },
    { item: 6, rubro: '6.1 - Estructura de cubierta', unidad: 'm2', ratio: 1.0, precioKey: 'estructura_cubierta', catDefault: '06 - Cubierta', descDefault: 'Estructura de cubierta', desglose: 'Vigas, correas y tensor. Pendiente mínima 30%' },
    { item: 6, rubro: '6.2 - Cubierta terminada', unidad: 'm2', ratio: 1.0, precioKey: 'chapa', catDefault: '06 - Cubierta', descDefault: 'Cubierta terminada', desglose: 'Chapa trapezoidal/acanalada. Tornillos autoperforantes con golilla' },
    { item: 7, rubro: '7.1 - Revoque грубый', unidad: 'm2', ratio: 2.2, precioKey: 'revoque_grueso', catDefault: '07 - Revoques', descDefault: 'Revoque грубый (15mm)', desglose: 'Revoque грубый con malla一把malla. Incluye andamiaje' },
    { item: 7, rubro: '7.2 - Revoque fino', unidad: 'm2', ratio: 2.2, precioKey: 'revoque_fino', catDefault: '07 - Revoques', descDefault: 'Revoque fino (5mm)', desglose: 'Revoque fino con terminaciónzeta' },
    { item: 8, rubro: '8.1 - Cielorraso suspensión', unidad: 'm2', ratio: 1.0, precioKey: 'cielorraso', catDefault: '08 - Yesería', descDefault: 'Cielorraso suspendido', desglose: 'Placas de yeso Durlock 9.5mm. Estructura omega' },
    { item: 9, rubro: '9.1 - Contrapiso', unidad: 'm2', ratio: 1.0, precioKey: 'contrapiso', catDefault: '09 - Contrapiso', descDefault: 'Contrapiso de hormigón', desglose: 'Hormigón de contrapiso, esp: 10-15cm' },
    { item: 10, rubro: '10.1 - Piso interior', unidad: 'm2', ratio: 1.0, precioKey: 'piso', catDefault: '10 - Pisos', descDefault: 'Piso de terminación', desglose: 'Porcelanato/Cerámico. Colocación con pegamento C2' },
    { item: 10, rubro: '10.2 - Zócalo', unidad: 'ml', ratio: 1.0, precioKey: 'zocalo', catDefault: '10 - Pisos', descDefault: 'Zócalo', desglose: 'Zócalo de mismo material' },
    { item: 12, rubro: '12.1 - Inst. eléctrica', unidad: 'm2', ratio: 1.0, precioKey: 'electrica', catDefault: '12 - Instalación Eléctrica', descDefault: 'Instalación eléctrica completa', desglose: 'Bocas, cableado, tablero con termomagnéticas' },
    { item: 13, rubro: '13.1 - Red de agua', unidad: 'm2', ratio: 1.0, precioKey: 'sanitaria', catDefault: '13 - Instalación Sanitaria', descDefault: 'Distribución de agua', desglose: 'Cañerías agua fría/caliente. Termofusión o multicapa' },
    { item: 13, rubro: '13.2 - Desagües', unidad: 'm2', ratio: 1.0, precioKey: 'desague', catDefault: '13 - Instalación Sanitaria', descDefault: 'Red de desagües', desglose: 'Caños PVC 110mm, 40mm, 50mm. Botes sifonados' },
    { item: 14, rubro: '14.1 - Red de gas', unidad: 'm2', ratio: 0.3, precioKey: 'gas', catDefault: '14 - Instalación de Gas', descDefault: 'Instalación de gas', desglose: 'Caño de gas, Regulador, válvulas' },
    { item: 15, rubro: '15.1 - Aire acondicionado', unidad: 'un', ratio: 0.1, precioKey: 'aire', catDefault: '15 - Climatización', descDefault: 'Aire acondicionado', desglose: 'Split inverter frío/calor' },
    { item: 16, rubro: '16.1 - Inodoro', unidad: 'un', ratio: 0.05, precioKey: 'inodoro', catDefault: '16 - Sanitarios y Grifería', descDefault: 'Inodoro', desglose: 'Inodoro con deposito, asiento' },
    { item: 16, rubro: '16.2 - Lavatorio', unidad: 'un', ratio: 0.05, precioKey: 'lavatorio', catDefault: '16 - Sanitarios y Grifería', descDefault: 'Lavatorio/Vanity', desglose: 'Bacha y grifería monocomando' },
    { item: 16, rubro: '16.3 - Ducha', unidad: 'un', ratio: 0.04, precioKey: 'ducha', catDefault: '16 - Sanitarios y Grifería', descDefault: 'Ducha', desglose: 'Columna, grifería, receptor' },
    { item: 16, rubro: '16.4 - Grifería cocina', unidad: 'un', ratio: 0.03, precioKey: 'griferia_cocina', catDefault: '16 - Sanitarios y Grifería', descDefault: 'Grifería de cocina', desglose: 'Monocomando, flexible' },
    { item: 17, rubro: '17.1 - Puerta interior', unidad: 'un', ratio: 0.15, precioKey: 'puerta_interior', catDefault: '17 - Carpintería', descDefault: 'Puerta de interior', desglose: 'Marco, bisagras, cerradura' },
    { item: 17, rubro: '17.2 - Ventana', unidad: 'un', ratio: 0.15, precioKey: 'ventana', catDefault: '17 - Carpintería', descDefault: 'Ventana', desglose: 'Ventana aluminio DVH' },
    { item: 17, rubro: '17.3 - Vidrio', unidad: 'm2', ratio: 0.2, precioKey: 'vidrio', catDefault: '17 - Carpintería', descDefault: 'Vidrio', desglose: 'Float 4mm o DVH' },
    { item: 17, rubro: '17.4 - Placard', unidad: 'un', ratio: 0.1, precioKey: 'placard', catDefault: '17 - Carpintería', descDefault: 'Placard', desglose: 'Frente de melamina, correderas' },
    { item: 18, rubro: '18.1 - Pintura interior', unidad: 'm2', ratio: 2.5, precioKey: 'pintura', catDefault: '18 - Pintura', descDefault: 'Pintura interior', desglose: 'Látex 2 manos sobre revoque fino' },
    { item: 18, rubro: '18.2 - Pintura exterior', unidad: 'm2', ratio: 1.0, precioKey: 'pintura_exterior', catDefault: '18 - Pintura', descDefault: 'Pintura exterior', desglose: 'Látex exterior 2 manos' },
    { item: 19, rubro: '19.1 - Limpieza final', unidad: 'm2', ratio: 1.0, precioKey: 'limpieza_final', catDefault: '19 - Limpieza y Entrega', descDefault: 'Limpieza final de obra', desglose: 'Limpieza general, retiro de escombros' },
    { item: 20, rubro: '20.1 - Ayudas de gremio', unidad: 'gl', ratio: 1.0, precioKey: 'ayuda_gremio', catDefault: '20 - Otros Gastos', descDefault: 'Ayudas de gremios menores', desglose: 'Trabajos menores de terminación' },
  ];

  const preciosReferencia: Record<string, number> = {
    limpieza: 1,
    replanteo: 2,
    cartel: 50,
    excavacion: 8,
    relleno: 6,
    hormigon_fundacion: 35,
    viga_fundacion: 30,
    columna: 25,
    encadenado: 15,
    ladrillo: 8,
    ladrillo_12: 5,
    hidrofugo: 5,
    aislante: 6,
    estructura_cubierta: 18,
    chapa: 12,
    revoque_grueso: 8,
    revoque_fino: 6,
    cielorraso: 10,
    contrapiso: 12,
    piso: 20,
    zocalo: 3,
    electrica: 25,
    sanitaria: 30,
    desague: 8,
    gas: 20,
    aire: 180,
    inodoro: 100,
    ducha: 150,
    lavatorio: 80,
    griferia_cocina: 60,
    puerta_interior: 80,
    ventana: 120,
    vidrio: 15,
    placard: 140,
    pintura: 5,
    pintura_exterior: 7,
    limpieza_final: 3,
    ayuda_gremio: 800,
  };

  const items: ItemPresupuesto[] = [];

  for (const base of itemsBase) {
    const cantidad = Math.round(superficie * base.ratio * 100) / 100;
    
    const ref = precios[base.precioKey];
    let precioUnitario = ref ? ref.precio : preciosReferencia[base.precioKey];
    
    const rubrosConFactor = ['porcelanato', 'ventana', 'puerta_exterior', 'inodoro', 'bidet', 'ducha', 'lavatorio', 'griferia_cocina', 'puerta_interior', 'placard', 'pintura'];
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
      fuente_url: ref?.fuente_url || buscarLinkCompra(base.rubro.toLowerCase())?.url || '',
      fecha_precio: ref ? ref.fecha : hoy,
      confianza: ref ? "alta" : "media",
      nota_confianza: ref ? '' : 'Dato paramétrico USD 2026',
      precio_desactualizado: false,
      razonamiento_ia: `Calculado para ${superficie}m2. DESGLOSE: ${base.desglose}`
    });
  }

  return items;
}

export const llmService = {
  generateBudgetItems,
  callAnthropic: async () => [],
};
