import { Blueprint, ExtractionResult } from "../blueprint/schema";
import { parsePDF } from "../parsers/pdf_parser";
import { parseImage } from "../parsers/image_parser";
import { parseSKP } from "../parsers/sketchup_parser";
import { parseDWG } from "../parsers/autocad_parser";
import { EXTRACTION } from "../config/settings";
import * as path from "path";

function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

function mergeResults(
  results: Array<{ blueprint: Partial<Blueprint>; confianza: Record<string, any>; notas: string[] }>
): ExtractionResult {
  const mergedBlueprint: Partial<Blueprint> = {};
  const mergedConfianza: Record<string, "alta" | "media" | "baja" | "no_detectado"> = {};
  const allNotas: string[] = [];
  const archivosProcesados: string[] = [];

  const confidencePriority = { alta: 3, media: 2, baja: 1, no_detectado: 0 };

  for (const result of results) {
    for (const [key, value] of Object.entries(result.blueprint)) {
      if (value !== undefined && value !== null) {
        const currentConf = mergedConfianza[key];
        const newConf = result.confianza[key] as "alta" | "media" | "baja" | "no_detectado";
        if (!currentConf || confidencePriority[newConf] > confidencePriority[currentConf]) {
          (mergedBlueprint as any)[key] = value;
          mergedConfianza[key] = newConf;
        }
      }
    }
    allNotas.push(...result.notas);
  }

  for (const key of Object.keys(mergedBlueprint)) {
    if (!mergedConfianza[key]) {
      mergedConfianza[key] = "media";
    }
  }

  return {
    blueprint_parcial: mergedBlueprint,
    confianza: mergedConfianza,
    archivos_procesados: archivosProcesados,
    notas_extraccion: allNotas,
  };
}

export async function extractFromFiles(filePaths: string[]): Promise<ExtractionResult> {
  const results = [];

  for (const filePath of filePaths) {
    const ext = getFileExtension(filePath);
    
    if (!EXTRACTION.supportedFormats.includes(ext)) {
      console.warn(`[Extraction] Formato no soportado: ${ext} en ${filePath}`);
      continue;
    }

    try {
      if (ext === ".pdf") {
        const result = await parsePDF(filePath);
        results.push(result);
      } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        const result = await parseImage(filePath);
        results.push(result);
      } else if (ext === ".skp") {
        const result = await parseSKP(filePath);
        results.push(result);
      } else if (ext === ".dwg") {
        const result = await parseDWG(filePath);
        results.push(result);
      }
    } catch (error) {
      console.error(`[Extraction] Error procesando ${filePath}:`, error);
    }
  }

  if (results.length === 0) {
    return {
      blueprint_parcial: {},
      confianza: {},
      archivos_procesados: [],
      notas_extraccion: ["No se pudo extraer datos de ningún archivo"],
    };
  }

  const merged = mergeResults(results);
  merged.archivos_procesados = filePaths;

  console.log(`[Extraction] Extraídos ${Object.keys(merged.blueprint_parcial).length} campos de ${filePaths.length} archivos`);
  return merged;
}

export const extractionAgent = {
  extractFromFiles,
};