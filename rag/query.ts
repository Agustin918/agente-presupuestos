import { ObraHistorica } from "../blueprint/schema";
import { vectorStore } from "./store";

export async function queryObrasSimilares(
  estructura: string,
  superficie_m2: number,
  categoria: string,
  estudio_id?: string
): Promise<ObraHistorica[]> {
  let obras = await vectorStore.getObras();

  if (estudio_id) {
    obras = obras.filter((o) => o.estudio_id === estudio_id);
  }

  // Solo filtra por estructura (sistema constructivo)
  // ignora m2 y categoría para no perder obras por filtro muy estricto
  obras = obras.filter((o) => o.estructura === estructura);

  return obras;
}

export const ragQuery = {
  queryObrasSimilares,
};