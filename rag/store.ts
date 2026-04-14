import { ObraHistorica } from "../blueprint/schema";

export interface VectorEntry {
  id: string;
  obra: ObraHistorica;
  embedding?: number[];
}

const STORE: VectorEntry[] = [];

export async function addObra(obra: ObraHistorica): Promise<void> {
  const existente = STORE.find((e) => e.id === obra.id);
  if (existente) {
    Object.assign(existente, obra);
  } else {
    STORE.push({ id: obra.id, obra });
  }
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