import { ObraHistorica } from "../blueprint/schema";
import * as fs from "fs";
import * as path from "path";
import { RAG } from "../config/settings";

export interface VectorEntry {
  id: string;
  obra: ObraHistorica;
  embedding?: number[];
}

const STORE_FILE = path.resolve(process.cwd(), RAG.vectorStorePath || "data/rag/store.json");

let STORE: VectorEntry[] = loadStore();

function loadStore(): VectorEntry[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      const data = JSON.parse(content);
      // Validar que sea un array
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error("[RAG] Error cargando store:", e);
  }
  return [];
}

function saveStore(): void {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(STORE, null, 2));
  } catch (e) {
    console.error("[RAG] Error guardando store:", e);
  }
}

export async function addObra(obra: ObraHistorica): Promise<void> {
  const existente = STORE.find((e) => e.id === obra.id);
  if (existente) {
    Object.assign(existente, obra);
  } else {
    STORE.push({ id: obra.id, obra });
  }
  saveStore();
}

export async function getObras(): Promise<ObraHistorica[]> {
  return STORE.map((e) => e.obra);
}

export async function searchObras(
  query: string,
  filters?: { estudio_id?: string; estructura?: string; categorias?: string[] }
): Promise<ObraHistorica[]> {
  let resultados = STORE.map((e) => e.obra);

  if (filters?.estudio_id) {
    resultados = resultados.filter((o) => o.estudio_id === filters.estudio_id);
  }

  if (filters?.estructura) {
    resultados = resultados.filter((o) => o.estructura === filters.estructura);
  }

  if (filters?.categorias && filters.categorias.length > 0) {
    resultados = resultados.filter((o) => filters.categorias!.includes(o.categoria));
  }

  return resultados;
}

export const vectorStore = {
  addObra,
  getObras,
  searchObras,
};