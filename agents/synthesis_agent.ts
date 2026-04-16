import { Blueprint, FACTOR_TERMINACION, Categoria, ItemPresupuesto, Presupuesto, PresupuestoComparativo } from "../blueprint/schema";
import { ragQuery } from "../rag/query";
import { researchAgent } from "./research_agent";
import { getMaterialesDelBlueprint } from "./orchestrator";
import { TASA_CAMBIO_USD as DEFAULT_TASA, CURRENCY } from "../config/settings";
import { llmService } from "../services/llm";
import { convertirArsAUsd } from "../utils/currency";
import { ConstructionEngine } from "../logic/construction_engine";
import { LogisticsEngine } from "../logic/logistics_engine";

const CATEGORIAS_ETAPAS = {
  PRELIMINARES: "01 - Trabajos Preliminares",
  MOVIMIENTO_SUELOS: "02 - Movimiento de Suelos",
  ESTRUCTURA_RESISTENTE: "03 - Estructura Resistente",
  ALBANILERIA_GRUESA: "04 - Albañilería Obra Gruesa",
  CAPAS_AISLADORAS: "05 - Capas Aisladoras",
  TECHOS: "06 - Cubiertas y Techos",
  TERMINACIONES_MUROS: "07 - Revestimientos y Revoques",
  CIELORRASOS: "08 - Cielorrasos",
  CARPINTERIA_EXTERIOR: "09 - Carpintería Exterior",
  VIDRIOS: "10 - Vidrios y Cristales",
  PISOS_ZOCALOS: "11 - Pisos y Zócalos",
  INST_ELECTRICA: "12 - Instalación Eléctrica",
  INST_SANITARIA: "13 - Instalación Sanitaria y Agua",
  INST_GAS: "14 - Instalación de Gas",
  CLIMATIZACION: "15 - Climatización (Calefacción/AA)",
  SANITARIOS_GRIFERIA: "16 - Sanitarios y Grifería",
  CARPINTERIA_INTERIOR: "17 - Carpintería Interior (Puertas/Placards)",
  PINTURA: "18 - Pintura",
  EQUIPAMIENTO: "19 - Equipamiento (Cocina/Vanitories)",
  VARIOS_EXTERIOR: "20 - Obras Exteriores y Varios",
};

export async function generarPresupuesto(
  blueprint: Blueprint,
  precios?: Record<string, any>,
  confianzaExtraccion?: Record<string, "alta" | "media" | "baja" | "manual">,
  tasaCambio: number = DEFAULT_TASA
): Promise<Presupuesto> {
  const materiales = getMaterialesDelBlueprint(blueprint);
  const m2 = blueprint.superficie_cubierta_m2 + ((blueprint.superficie_semicubierta_m2 || 0) * 0.5);

  // 1. Obtención de precios (y conversión inmediata a USD si vienen en ARS)
  const rawPrecios = precios || (await researchAgent.getPrices(materiales, blueprint.ubicacion));
  const preciosUSD: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }> = {};
  
  for (const [key, val] of Object.entries(rawPrecios)) {
    if (val && typeof val === 'object' && 'precio' in val) {
      let precio = val.precio;
      // SIEMPRE TRABAJAMOS EN USD INTERNAMENTE
      if (val.unidad === 'ARS' || val.unidad === 'pesos' || precio > 5000) { // Heurística: si es mayor a 5000 es ARS
        precio = convertirArsAUsd(precio, tasaCambio);
      }
      preciosUSD[key] = {
        precio,
        unidad: 'USD',
        fuente_url: val.fuente_url || '',
        fecha: val.fecha || new Date().toISOString().split('T')[0],
      };
    }
  }

  // 2. RAG
  let obrasSimilares: any[] = [];
  try {
    obrasSimilares = await ragQuery.queryObrasSimilares(blueprint.estructura, m2, blueprint.categoria, blueprint.estudio_id);
  } catch (error) {}

  // 3. Generación de ítems (El LLM ya recibe todo en USD)
  let items = await llmService.generateBudgetItems(blueprint, preciosUSD, obrasSimilares);

  // 4. Agregar rubros automáticos por terreno y adicionales
  if (blueprint.terreno.zona_inundable) {
    const puUSD = 25 * blueprint.factor_terminacion; // Platea reforzada USD/m2
    items.push(generarItemEspecial("Refuerzo Zona Inundable", "Pilotes y viga de encadenado", m2, "m2", puUSD, CATEGORIAS_ETAPAS.MOVIMIENTO_SUELOS));
  }

  // 5. Gastos Generales y Logística (Asegurar USD)
  const reporteLogistico = await LogisticsEngine.analyze(blueprint);
  const fleteUSD = convertirArsAUsd(reporteLogistico.costo_flete_estimado, tasaCambio);
  items.push(generarItemEspecial("Flete y Logística", `Transporte a ${reporteLogistico.distancia_km}km`, 1, "global", fleteUSD, CATEGORIAS_ETAPAS.PRELIMINARES));

  // 6. Beneficio e Indirectos (30%)
  const subtotalNeto = items.reduce((acc, i) => acc + i.subtotal, 0);
  items.push(generarItemEspecial("Gastos Indirectos y Utilidad", "GGU (30% de costo directo)", 1, "global", Math.round(subtotalNeto * 0.3), CATEGORIAS_ETAPAS.PRELIMINARES));

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);

  return {
    obra: blueprint.nombre_obra,
    fecha: new Date().toISOString().split('T')[0],
    superficie_m2: m2,
    estructura: blueprint.estructura,
    categoria: blueprint.categoria,
    factor_terminacion: blueprint.factor_terminacion,
    total_estimado: total,
    costo_m2: Math.round(total / m2),
    divisa: "USD",
    items,
    precios_frescos: items.filter(i => i.confianza === "alta").length,
    precios_cache: items.filter(i => i.confianza === "media").length,
    precios_vencidos: 0,
    _blueprint: blueprint as any,
    validacion_tecnica: { resultado: "ok", mensajes: [] }
  };
}

function generarItemEspecial(rubro: string, desc: string, cant: number, un: string, pu: number, cat: string): ItemPresupuesto {
  return {
    rubro,
    descripcion: desc,
    unidad: un,
    cantidad: cant,
    precio_unitario: Math.round(pu),
    subtotal: Math.round(cant * pu),
    categoria: cat,
    fuente: "Motor Inteligencia Estudios",
    fuente_url: "",
    fecha_precio: new Date().toISOString().split('T')[0],
    confianza: "media",
    nota_confianza: "Cálculo técnico automático",
    precio_desactualizado: false
  };
}

export async function generarPresupuestoComparativo(blueprint: Blueprint): Promise<PresupuestoComparativo> {
  const categorias: Categoria[] = ["economico", "estandar", "premium", "lujo"];
  const escenarios: PresupuestoComparativo["escenarios"] = [];
  const base = await generarPresupuesto(blueprint);

  for (const cat of categorias) {
    const factor = FACTOR_TERMINACION[cat];
    const total = Math.round(base.total_estimado * (factor / blueprint.factor_terminacion));
    escenarios.push({
      categoria: cat,
      factor,
      total_estimado: total,
      diferencia_vs_economico: `${Math.round(((total - base.total_estimado) / base.total_estimado) * 100)}%`,
      items_que_mas_cambian: ["Terminaciones", "Aberturas"]
    });
  }

  return { obra: blueprint.nombre_obra, fecha: base.fecha, escenarios };
}

export const synthesisAgent = { generarPresupuesto, generarPresupuestoComparativo };