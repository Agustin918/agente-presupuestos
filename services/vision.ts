import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import { ANTHROPIC_API_KEY } from '../config/settings';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export interface VisionExtractionResult {
  blueprint: Record<string, any>;
  confianza: Record<string, 'alta' | 'media' | 'baja'>;
  notas: string[];
}

export async function extractFromImage(filePath: string): Promise<VisionExtractionResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada. Usando mock.');
  }

  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = getMimeType(filePath) as 'image/jpeg' | 'image/png';

  const prompt = `Eres un experto en arquitectura y construcción. Analiza esta imagen de planos de vivienda y extrae la siguiente información en formato JSON:

{
  "superficie_cubierta_m2": número estimado,
  "dormitorios": número,
  "cantidad_banos": número,
  "tiene_cochera": booleano,
  "plantas": 1 | 2 | 3 | "pb_semisotano",
  "tiene_escalera": booleano,
  "estructura": "steel_frame" | "hormigon_armado" | "albanileria" | "madera" | "mixto",
  "cubierta": "chapa_trapezoidal" | "chapa_acanalada" | "membrana_losa" | "teja_ceramica" | "techo_verde",
  "categoria": "economico" | "estandar" | "premium" | "lujo",
  "pisos": "porcelanato" | "ceramico" | "madera" | "microcemento" | "a_definir",
  "aberturas": "aluminio_basico" | "aluminio_dvh" | "pvc" | "madera"
}

Para cada campo, asigna un nivel de confianza: "alta" si es claramente visible, "media" si se infiere con cierta ambigüedad, "baja" si es una suposición.

Devuelve un JSON con dos objetos: "blueprint" con los campos extraídos (solo incluye campos detectados) y "confianza" con el nivel para cada campo.

Además, incluye un array "notas" con observaciones sobre lo que se ve en los planos.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta no es texto');
    }

    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) || content.text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('No se encontró JSON en la respuesta');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      blueprint: parsed.blueprint || {},
      confianza: parsed.confianza || {},
      notas: parsed.notas || [],
    };
  } catch (error) {
    console.error('[Vision] Error en extracción:', error);
    return {
      blueprint: {},
      confianza: {},
      notas: [`Error en extracción con Claude: ${error}`],
    };
  }
}

export async function extractFromPDF(filePath: string): Promise<VisionExtractionResult> {
  // TODO: Integrar API real de Claude para PDFs (soporte de documentos)
  // Por ahora devolvemos mock
  console.log('[Vision] PDF mock para:', filePath);
  return {
    blueprint: {
      superficie_cubierta_m2: 150,
      dormitorios: 3,
      cantidad_banos: 2,
      tiene_cochera: true,
      plantas: 1,
      tiene_escalera: false,
      estructura: "albanileria",
      cubierta: "chapa_acanalada",
      categoria: "estandar",
      pisos: "ceramico",
      aberturas: "aluminio_basico",
    },
    confianza: {
      superficie_cubierta_m2: "media",
      dormitorios: "alta",
      cantidad_banos: "alta",
      tiene_cochera: "alta",
      plantas: "alta",
      tiene_escalera: "alta",
      estructura: "baja",
      cubierta: "media",
      categoria: "baja",
      pisos: "baja",
      aberturas: "baja",
    },
    notas: [
      "PDF procesado con mock (API no implementada)",
      "Estructura inferida de muros en plano, confirmar con cliente",
      "Superficie estimada de planos con margen ±10%"
    ],
  };
}

function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      throw new Error(`Formato no soportado: ${ext}. Solo JPG/PNG.`);
  }
}