import { ObraHistorica } from "../blueprint/schema";
import { vectorStore } from "./store";

export async function queryObrasSimilares(
  estructura: string,
  superficie_m2: number,
  categoria: string,
  estudio_id?: string
): Promise<ObraHistorica[]> {
  const filtroMin = superficie_m2 * 0.8;
  const filtroMax = superficie_m2 * 1.2;

  let obras = await vectorStore.getObras();

  if (estudio_id) {
    obras = obras.filter((o) => o.estudio_id === estudio_id);
  }

  obras = obras.filter(
    (o) =>
      o.estructura === estructura &&
      o.superficie_m2 >= filtroMin &&
      o.superficie_m2 <= filtroMax &&
      (o.categoria === categoria || Math.abs(FactorToNumber(o.categoria) - FactorToNumber(categoria)) <= 0.5)
  );

  return obras;
}

function FactorToNumber(cat: string): number {
  const map: Record<string, number> = {
    economico: 1.0,
    estandar: 1.35,
    premium: 1.8,
    lujo: 2.5,
  };
  return map[cat] || 1.0;
}

export const ragQuery = {
  queryObrasSimilares,
};