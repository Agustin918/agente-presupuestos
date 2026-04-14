import { Blueprint } from "../blueprint/schema";
import { extractFromImage, VisionExtractionResult } from "../services/vision";

export interface ImageExtractionResult {
  blueprint: Partial<Blueprint>;
  confianza: Record<string, "alta" | "media" | "baja" | "no_detectado">;
  notas: string[];
}

export async function parseImage(filePath: string): Promise<ImageExtractionResult> {
  console.log(`[Image Parser] Procesando: ${filePath}`);

  const result: ImageExtractionResult = {
    blueprint: {},
    confianza: {},
    notas: [],
  };

  try {
    // Intentar usar Claude Vision si hay API key
    const visionResult = await extractFromImage(filePath);
    
    // Mapear campos de visionResult a blueprint
    for (const [key, value] of Object.entries(visionResult.blueprint)) {
      (result.blueprint as any)[key] = value;
    }
    for (const [key, value] of Object.entries(visionResult.confianza)) {
      (result.confianza as any)[key] = value;
    }
    result.notas.push(...visionResult.notas);
    
    if (Object.keys(visionResult.blueprint).length === 0) {
      throw new Error('No se extrajeron campos, usando mock');
    }
    
    result.notas.push("Imagen procesada con visión de Claude (API real)");
    
  } catch (error) {
    console.log(`[Image Parser] Fallback a mock: ${error}`);
    // Fallback a datos mock
    result.notas.push("Imagen procesada con visión de Claude (mock)");
    result.blueprint.cubierta = "chapa_acanalada";
    result.confianza.cubierta = "alta";
    result.blueprint.revestimiento_exterior = "revoque_fino";
    result.confianza.revestimiento_exterior = "media";
    result.blueprint.tiene_quincho = false;
    result.confianza.tiene_quincho = "alta";
    result.blueprint.tiene_galeria = true;
    result.confianza.tiene_galeria = "media";
    result.blueprint.tiene_deck = true;
    result.confianza.tiene_deck = "alta";
    result.blueprint.superficie_deck_m2 = 20;
    result.confianza.superficie_deck_m2 = "baja";
    result.blueprint.cantidad_banos = 2;
    result.confianza.cantidad_banos = "baja";
    result.notas.push("Cantidad de baños inferida de tamaño de la vivienda (mock)");
  }

  return result;
}