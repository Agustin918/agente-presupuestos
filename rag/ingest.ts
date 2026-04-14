import { ObraHistorica } from "../blueprint/schema";
import { vectorStore } from "./store";
import * as fs from "fs";
import * as path from "path";

const DIRECTORIO_NUEVAS = "./data/historico/nuevas";
const DIRECTORIO_PROCESADAS = "./data/historico/procesadas";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function procesarArchivo(filePath: string): ObraHistorica | null {
  try {
    const contenido = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(contenido);

    if (!data.nombre || !data.superficie_m2 || !data.estructura || !data.categoria) {
      console.log(`[Ingest] Archivo inválido: ${filePath}`);
      return null;
    }

    const obra: ObraHistorica = {
      id: data.id || `obra_${Date.now()}`,
      nombre: data.nombre,
      fecha_cierre: data.fecha_cierre || new Date().toISOString().split("T")[0],
      estudio_id: data.estudio_id || "estudio_001",
      estructura: data.estructura,
      superficie_m2: data.superficie_m2,
      categoria: data.categoria,
      ubicacion: data.ubicacion || "",
      ratios: data.ratios || {},
      desvio_estimado_real: data.desvio_estimado_real || 0,
      observaciones: data.observaciones || "",
    };

    return obra;
  } catch (e) {
    console.error(`[Ingest] Error procesando ${filePath}:`, e);
    return null;
  }
}

export function ingestObras(): { procesadas: number; errores: number } {
  ensureDir(DIRECTORIO_NUEVAS);
  ensureDir(DIRECTORIO_PROCESADAS);

  const archivos = fs.readdirSync(DIRECTORIO_NUEVAS).filter((f) => f.endsWith(".json"));
  let procesadas = 0;
  let errores = 0;

  for (const archivo of archivos) {
    const origen = path.join(DIRECTORIO_NUEVAS, archivo);
    const obra = procesarArchivo(origen);

    if (obra) {
      vectorStore.addObra(obra);
      console.log(`[Ingest] Agregada obra: ${obra.nombre}`);

      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const destino = path.join(DIRECTORIO_PROCESADAS, `${timestamp}_${archivo}`);
      fs.renameSync(origen, destino);
      procesadas++;
    } else {
      errores++;
    }
  }

  console.log(`[Ingest] Procesadas: ${procesadas}, Errores: ${errores}`);
  return { procesadas, errores };
}

export function ingestSingleObra(obra: ObraHistorica): void {
  vectorStore.addObra(obra);
  console.log(`[Ingest] Obra agregada: ${obra.nombre}`);
}

export const ingest = {
  ingestObras,
  ingestSingleObra,
};