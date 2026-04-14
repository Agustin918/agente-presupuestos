import { Blueprint, FACTOR_TERMINACION, Categoria, ItemPresupuesto, Presupuesto, PresupuestoComparativo } from "../blueprint/schema";
import { ragQuery } from "../rag/query";
import { researchAgent } from "./research_agent";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import { generateBudgetItems } from "../services/llm";

const RUBROS_BASE = [
  { rubro: "Excavación y movimiento de suelos", descripcion: "Excavación manual y mecánica", unidad: "m3", factor: 0.3 },
  { rubro: "Fundaciones", descripcion: "Hormigón armado para fundaciones", unidad: "m3", factor: 0.15 },
  { rubro: "Estructura", descripcion: "Estructura principal", unidad: "m2", factor: 1.0 },
  { rubro: "Muros", descripcion: "Muros exteriores e interiores", unidad: "m2", factor: 1.5 },
  { rubro: "Cubierta", descripcion: "Estructura de cubierta", unidad: "m2", factor: 0.8 },
  { rubro: "Carpintería de aberturas", descripcion: "Puertas y ventanas", unidad: "un", factor: 0.12 },
  { rubro: "Instalación eléctrica", descripcion: "Tendido eléctrico completo", unidad: "m2", factor: 1.0 },
  { rubro: "Instalación sanitaria", descripcion: "Cañerías y artefactos", unidad: "m2", factor: 0.8 },
  { rubro: "Instalación de gas", descripcion: "Cañerías de gas y regulación", unidad: "m2", factor: 0.5 },
  { rubro: "Tabiquería seca", descripcion: "Divisores interiores", unidad: "m2", factor: 1.2 },
  { rubro: "Revestimientos", descripcion: "Revoques y terminaciones", unidad: "m2", factor: 1.0 },
  { rubro: "Pisos", descripcion: "Piso terminado", unidad: "m2", factor: 1.0 },
  { rubro: "Pintura", descripcion: "Pintura interior y exterior", unidad: "m2", factor: 0.8 },
  { rubro: "Baños (artefactos)", descripcion: "Grifería y sanitarios", unidad: "un", factor: 0.15 },
  { rubro: "Cocina (muebles)", descripcion: "Mobiliario de cocina", unidad: "un", factor: 0.1 },
  { rubro: "Instalación de climatización", descripcion: "Aire acondicionado", unidad: "m2", factor: 0.6 },
  { rubro: "Paneles solares", descripcion: "Instalación de paneles", unidad: "un", factor: 0.05 },
  { rubro: "Domótica", descripcion: "Sistema de automatización", unidad: "un", factor: 0.03 },
  { rubro: "Pileta", descripcion: "Construcción de pileta", unidad: "un", factor: 0.08 },
  { rubro: "Exterior y paisajismo", descripcion: "Jardín y cercos", unidad: "m2", factor: 0.2 },
];

function getMaterialesDelBlueprint(blueprint: Blueprint): string[] {
  const materiales: string[] = [];

  if (blueprint.estructura === "steel_frame") {
    materiales.push("steel frame", "panel durlock", "tornillos");
  } else if (blueprint.estructura === "hormigon_armado") {
    materiales.push("hormigon", "hierro 8mm", "hierro 6mm", "cemento");
  } else if (blueprint.estructura === "albanileria") {
    materiales.push("ladrillo", "cemento", "arena");
  }

  if (blueprint.cubierta.includes("chapa")) {
    materiales.push("chapa", "tornillo autoperforante");
  }

  if (blueprint.pisos === "porcelanato") {
    materiales.push("porcelanato", "pegamento");
  } else if (blueprint.pisos === "ceramico") {
    materiales.push("ceramico", "pegamento");
  }

  if (blueprint.aberturas.includes("aluminio")) {
    materiales.push("ventana aluminio");
  } else if (blueprint.aberturas === "pvc") {
    materiales.push("ventana pvc");
  }

  if (blueprint.instalaciones.includes("electrica")) {
    materiales.push("cable", "techa", "tablero");
  }
  if (blueprint.instalaciones.includes("sanitaria")) {
    materiales.push("caño pvp", "grifería");
  }
  if (blueprint.instalaciones.includes("gas")) {
    materiales.push("caño gas", "regulador");
  }
  if (blueprint.instalaciones.includes("paneles_solares")) {
    materiales.push("panel solar", "inversor");
  }

  return materiales;
}

function determinarConfianza(
  campo: string,
  confianzaExtraccion?: Record<string, "alta" | "media" | "baja" | "manual">,
  precioVigenciaDias?: number
): "alta" | "media" | "baja" {
  if (confianzaExtraccion && confianzaExtraccion[campo]) {
    const conf = confianzaExtraccion[campo];
    if (conf === "alta") return "alta";
    if (conf === "media") return "media";
    if (conf === "baja") return "baja";
  }

  if (precioVigenciaDias !== undefined) {
    if (precioVigenciaDias > 10) return "alta";
    if (precioVigenciaDias > 5) return "media";
    return "baja";
  }

  return "media";
}

async function generarItems(
  blueprint: Blueprint,
  precios: Record<string, any>,
  obrasSimilares: any[],
  confianzaExtraccion?: Record<string, "alta" | "media" | "baja" | "manual">
): Promise<ItemPresupuesto[]> {
  const m2 = blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0);
  
  // Transformar precios a formato esperado por generateBudgetItems
  const preciosFormateados: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }> = {};
  for (const [key, val] of Object.entries(precios)) {
    if (val && typeof val === 'object' && 'precio' in val) {
      preciosFormateados[key] = {
        precio: val.precio,
        unidad: val.unidad || 'un',
        fuente_url: val.fuente_url || '',
        fecha: val.fecha || new Date().toISOString().split('T')[0],
      };
    }
  }

  // Generar items con LLM o mock
  let items = await generateBudgetItems(blueprint, preciosFormateados, obrasSimilares);
  
  // Ajustar confianza basada en extracción
  items = items.map(item => {
    const conf = determinarConfianza(item.rubro, confianzaExtraccion);
    return { ...item, confianza: conf };
  });

  // Agregar rubros especiales por condiciones del terreno
  if (blueprint.terreno.zona_inundable) {
    items.push({
      rubro: "Pilotes / Carpeta hidrofuga",
      descripcion: "Refuerzo por zona inundable",
      unidad: "m2",
      cantidad: m2,
      precio_unitario: 25000,
      subtotal: Math.round(m2 * 25000),
      fuente: "estimación base",
      fecha_precio: new Date().toISOString().split("T")[0],
      confianza: "media",
      nota_confianza: "Rubro agregado automáticamente por zona inundable",
      precio_desactualizado: false,
    });
  }

  if (blueprint.terreno.desnivel_metros && blueprint.terreno.desnivel_metros > 1) {
    items.push({
      rubro: "Movimiento de suelos (desnivel)",
      descripcion: "Nivelación de terreno",
      unidad: "m3",
      cantidad: blueprint.terreno.desnivel_metros,
      precio_unitario: 15000,
      subtotal: Math.round(blueprint.terreno.desnivel_metros * 15000),
      fuente: "estimación base",
      fecha_precio: new Date().toISOString().split("T")[0],
      confianza: "media",
      precio_desactualizado: false,
    });
  }

  if (blueprint.terreno.requiere_demolicion) {
    items.push({
      rubro: "Demolición de estructura existente",
      descripcion: "Demolición y retiro de escombros",
      unidad: "m2",
      cantidad: m2,
      precio_unitario: 8000,
      subtotal: Math.round(m2 * 8000),
      fuente: "estimación base",
      fecha_precio: new Date().toISOString().split("T")[0],
      confianza: "media",
      precio_desactualizado: false,
    });
  }

  return items;
}

export async function generarPresupuesto(
  blueprint: Blueprint,
  precios?: Record<string, any>,
  confianzaExtraccion?: Record<string, "alta" | "media" | "baja" | "manual">
): Promise<Presupuesto> {
  const materiales = getMaterialesDelBlueprint(blueprint);
  const preciosResult = precios || (await researchAgent.getPrices(materiales, blueprint.ubicacion));

  const obrasSimilares = await ragQuery.queryObrasSimilares(
    blueprint.estructura,
    blueprint.superficie_cubierta_m2,
    blueprint.categoria,
    blueprint.estudio_id
  );

  const items = await generarItems(blueprint, preciosResult, obrasSimilares, confianzaExtraccion);

  const preciosFrescos = items.filter(i => i.precio_desactualizado === false).length;
  const preciosCache = items.filter(i => i.precio_desactualizado === true).length;
  const preciosVencidos = 0;

  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const total = Math.round(subtotal * blueprint.factor_terminacion);

  return {
    obra: blueprint.nombre_obra,
    fecha: new Date().toISOString().split("T")[0],
    superficie_m2: blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0),
    estructura: blueprint.estructura,
    categoria: blueprint.categoria,
    factor_terminacion: blueprint.factor_terminacion,
    total_estimado: total,
    items,
    precios_frescos: preciosFrescos,
    precios_cache: preciosCache,
    precios_vencidos: preciosVencidos,
  };
}

export async function generarPresupuestoComparativo(
  blueprint: Blueprint
): Promise<PresupuestoComparativo> {
  const categorias: Categoria[] = ["economico", "estandar", "premium", "lujo"];
  const escenarios: PresupuestoComparativo["escenarios"] = [];

  const basePresupuesto = await generarPresupuesto(blueprint);
  const baseTotal = basePresupuesto.total_estimado;

  for (const cat of categorias) {
    const factor = FACTOR_TERMINACION[cat];
    const total = Math.round(basePresupuesto.total_estimado * (factor / blueprint.factor_terminacion));
    const diff = baseTotal > 0 ? Math.round(((total - baseTotal) / baseTotal) * 100) : 0;

    escenarios.push({
      categoria: cat,
      factor,
      total_estimado: total,
      diferencia_vs_economico: diff > 0 ? `+${diff}%` : `${diff}%`,
      items_que_mas_cambian: ["Pisos", "Revestimientos", "Carpintería"],
    });
  }

  return {
    obra: blueprint.nombre_obra,
    fecha: new Date().toISOString().split("T")[0],
    escenarios,
  };
}

export const synthesisAgent = {
  generarPresupuesto,
  generarPresupuestoComparativo,
};