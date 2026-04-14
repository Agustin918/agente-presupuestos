import { Blueprint } from "../blueprint/schema";

export type PartialBlueprint = Partial<Blueprint>;

export interface ParserResult {
  blueprint: PartialBlueprint;
  confianza: Record<string, "alta" | "media" | "baja" | "no_detectado">;
  notas: string[];
}