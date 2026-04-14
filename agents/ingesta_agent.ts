import { ObraHistorica } from "../blueprint/schema";
import { vectorStore } from "../rag/store";
import { researchAgent } from "./research_agent";
import * as fs from "fs";
import * as path from "path";

const DIRECTORIO_NUEVAS = "./data/historico/nuevas";
const DIRECTORIO_PROCESADAS = "./data/historico/procesadas";

export interface ResultadoIngesta {
  procesadas: number;
  errores: number;
  RubenNuevos: number;
  ratiosAjustados: number;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function procesarPlanilla(filePath: string): Partial<ObraHistorica> | null {
  try {
    const contenido = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(contenido);

    if (!data.nombre || !data.superficie_m2) {
      return null;
    }

    const ratios: Record<string, number> = {};

    if (data.costos_por_rubro) {
      for (const [rubro, costo] of Object.entries(data.costos_por_rubro)) {
        const costoNum = typeof costo === "number" ? costo : 0;
        ratios[`${rubro}_por_m2`] = Math.round((costoNum / data.superficie_m2) * 100) / 100;
      }
    }

    const estimado = data.total_estimado || 0;
    const real = data.total_real || data.costo_total || 0;
    const desvio = estimado > 0 ? Math.round(((real - estimado) / estimado) * 100) / 100 : 0;

    return {
      id: data.id || `obra_${Date.now()}`,
      nombre: data.nombre,
      fecha_cierre: data.fecha_cierre || new Date().toISOString().split("T")[0],
      estudio_id: data.estudio_id || "estudio_001",
      estructura: data.estructura || "albanileria",
      superficie_m2: data.superficie_m2,
      categoria: data.categoria || "estandar",
      ubicacion: data.ubicacion || "",
      ratios,
      desvio_estimado_real: desvio,
      observaciones: data.observaciones || "",
    };
  } catch (e) {
    console.error(`[Ingesta] Error: ${filePath}`, e);
    return null;
  }
}

export async function run(): Promise<ResultadoIngesta> {
  ensureDir(DIRECTORIO_NUEVAS);
  ensureDir(DIRECTORIO_PROCESADAS);

  const archivos = fs.readdirSync(DIRECTORIO_NUEVAS).filter((f) => f.endsWith(".json"));
  let procesadas = 0;
  let errores = 0;
  let RubenNuevos = 0;
  let ratiosAjustados = 0;

  for (const archivo of archivos) {
    const origen = path.join(DIRECTORIO_NUEVAS, archivo);
    const obraData = procesarPlanilla(origen);

    if (!obraData) {
      errores++;
      continue;
    }

    const obra: ObraHistorica = {
      id: obraData.id || `obra_${Date.now()}`,
      nombre: obraData.nombre || "Sin nombre",
      fecha_cierre: obraData.fecha_cierre || new Date().toISOString().split("T")[0],
      estudio_id: obraData.estudio_id || "estudio_001",
      estructura: obraData.estructura || "albanileria",
      superficie_m2: obraData.superficie_m2 || 0,
      categoria: obraData.categoria || "estandar",
      ubicacion: obraData.ubicacion || "",
      ratios: obraData.ratios || {},
      desvio_estimado_real: obraData.desvio_estimado_real || 0,
      observaciones: obraData.observaciones || "",
    };

    if (Object.keys(obra.ratios).length > 0) {
      RubenNuevos++;
    }

    vectorStore.addObra(obra);

    if (obra.ratios) {
      const materialesAactualizar: string[] = [];
      for (const [rubro, valor] of Object.entries(obra.ratios)) {
        if (rubro.includes("_por_m2")) {
          const material = rubro.replace("_por_m2", "");
          materialesAactualizar.push(material);
        }
      }

      if (materialesAactualizar.length > 0) {
        await researchAgent.getPrices(materialesAactualizar, obra.ubicacion);
        ratiosAjustados++;
      }
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const destino = path.join(DIRECTORIO_PROCESADAS, `${timestamp}_${archivo}`);
    fs.renameSync(origen, destino);
    procesadas++;
  }

  console.log(`[Ingesta] Procesadas: ${procesadas}, Errores: ${errores}, Ruben: ${RubenNuevos}, Ratios: ${ratiosAjustados}`);

  return { procesadas, errores, RubenNuevos, ratiosAjustados };
}

export async function runSingle(obra: ObraHistorica): Promise<void> {
  vectorStore.addObra(obra);
  console.log(`[Ingesta] Obra registrada: ${obra.nombre}`);

  if (obra.ratios) {
    const materiales: string[] = [];
    for (const key of Object.keys(obra.ratios)) {
      if (key.includes("_por_m2")) {
        materiales.push(key.replace("_por_m2", ""));
      }
    }

    if (materiales.length > 0) {
      await researchAgent.getPrices(materiales, obra.ubicacion);
    }
  }
}

export const ingestaAgent = {
  run,
  runSingle,
};