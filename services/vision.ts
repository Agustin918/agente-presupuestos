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
    throw new Error('ANTHROPIC_API_KEY no configurada.');
  }

  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = getMimeType(filePath) as 'image/jpeg' | 'image/png';

  const prompt = `Eres un EXPERTO EN ARQUITECTURA ARGENTINA (arquitecto senior). 
  Tu objetivo es analizar un PLANO o IMAGEN TÉCNICA para un presupuesto de construcción con PRECISIÓN ABSOLUTA.
  
  PASO 1: ANÁLISIS DE CONTEXTO
  - Busca la ESCALA (ej: 1:100, 1:50) y las UNIDADES (m, cm, mm).
  - Busca el "CUADRO DE SUPERFICIES" o "PLANILLA DE LOCALES" (esta es tu fuente primaria de verdad).
  - Si no hay escala, busca objetos de referencia: puertas (estándar 0.80m), espesor de muros (0.15m o 0.30m), escalones (0.25m-0.28m).
  
  PASO 2: EXTRACCIÓN DE ÁREAS
  - Identifica Superficie Cubierta, Semicubierta y Libre.
  - Verifica matemáticamente: la suma de las áreas parciales debe coincidir con el total declarado.
  
  Devuelve EXCLUSIVAMENTE un objeto JSON:
  {
    "blueprint": {
      "superficie_cubierta_m2": número (punto decimal),
      "superficie_semicubierta_m2": número,
      "escala_detectada": "1:100" | "1:50" | "desconocida",
      "metodo_extraccion": "cuadro_superficies" | "calculo_grafico" | "inferencia",
      "dormitorios": número,
      "cantidad_banos": número,
      "plantas": 1 | 2 | 3,
      "estructura": "steel_frame" | "hormigon_armado" | "albanileria" | "madera",
      "cubierta": "chapa" | "losa" | "teja",
      "categoria": "economico" | "estandar" | "premium" | "lujo"
    },
    "confianza": { "campo": "alta" | "media" | "baja" },
    "notas": [
      "Explica brevemente tu razonamiento sobre la escala y cómo verificaste las áreas.",
      "Menciona si detectaste inconsistencias entre el gráfico y la planilla."
    ]
  }
  
  REGLA DE ORO: La precisión en el m2 es crítica. Si hay dudas, explícalo en las notas.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1500,
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
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada.');
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const base64Pdf = pdfBuffer.toString('base64');

  const prompt = `Analiza este documento PDF (PLANO TÉCNICO MULTIPÁGINA) con precisión quirúrgica.
  
  PROCEDIMIENTO:
  1. Identifica el "CUADRO DE SUPERFICIES" general en todas las páginas.
  2. Si hay varias plantas, suma las superficies individuales para obtener el total del proyecto.
  3. Detecta ESCALA y UNIDADES para validar visualmente si los m2 declarados tienen sentido.
  
  Devuelve EXCLUSIVAMENTE un JSON:
  {
    "blueprint": {
      "superficie_cubierta_m2": número,
      "superficie_semicubierta_m2": número,
      "escala_detectada": string,
      "metodo_extraccion": "cuadro_superficies" | "calculo_grafico",
      "dormitorios": número,
      "cantidad_banos": número,
      "plantas": número,
      "estructura": string,
      "cubierta": string,
      "categoria": string
    },
    "confianza": { "campo": "alta" | "media" | "baja" },
    "notas": [
      "Resumen por planta detectada.",
      "Justificación técnica de la superficie extraída.",
      "Advertencias sobre escala o legibilidad."
    ]
  }`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      temperature: 0,
       // betas: ["pdfs-2024-09-25"], // Beta para soporte nativo de PDF - comentado por error de tipo
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            } as any,
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Respuesta no es texto');

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se encontró JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      blueprint: parsed.blueprint || {},
      confianza: parsed.confianza || {},
      notas: parsed.notas || [],
    };
  } catch (error) {
    console.error('[Vision PDF] Error:', error);
    return { blueprint: {}, confianza: {}, notas: [`Error PDF: ${error}`] };
  }
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