import { Blueprint, Presupuesto } from "../blueprint/schema";
import { Anthropic } from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, MODEL, OPENROUTER_API_KEY, OPENROUTER_ENABLED, OPENROUTER_URL, OPENROUTER_MODEL, OLLAMA_URL, OLLAMA_MODEL, OLLAMA_ENABLED } from "../config/settings";
import axios from "axios";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

async function callOpenRouter(prompt: string): Promise<any> {
  if (!OPENROUTER_API_KEY) throw new Error("No hay API key de OpenRouter");
  const res = await axios.post(
    `${OPENROUTER_URL}/chat/completions`,
    {
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0,
    },
    {
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const text = res.data.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No se encontró JSON en respuesta");
  return JSON.parse(jsonMatch[0]);
}

async function callOllama(prompt: string): Promise<any> {
  const modelToUse = "llama3.2";
  const res = await axios.post(
    `${OLLAMA_URL}/api/chat`,
    {
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }
  );
  const text = res.data.message?.content;
  if (!text) {
    throw new Error("No hay contenido en respuesta de Ollama");
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log("[QA Agent] Respuesta de Ollama (no JSON):", text.substring(0, 300));
    throw new Error("No se encontró JSON en respuesta");
  }
  return JSON.parse(jsonMatch[0]);
}

export interface QAReport {
  status: 'aprobado' | 'con_observaciones' | 'critico';
  alerta_roja: string[];
  sugerencias: string[];
}

export class QAAgent {
  /**
   * Revisa un presupuesto generado contrastándolo con el blueprint original.
   * Actúa como un Arquitecto Senior auditando el trabajo de un Junior.
   */
  static async revisarPresupuesto(blueprint: Blueprint, presupuesto: Presupuesto): Promise<QAReport> {
    const prompt = `Actúa como un Arquitecto Senior experto en auditoría de presupuestos de construcción en Argentina. 
    Tu tarea es revisar de forma crítica el presupuesto generado para la siguiente obra:
    
    BLUEPRINT SOLICITADO:
    ${JSON.stringify(blueprint, null, 2)}
    
    PRESUPUESTO GENERADO (Resumen de ítems):
    ${JSON.stringify(presupuesto.items.map(i => ({ rubro: i.rubro, subtotal: i.subtotal, cat: i.categoria })), null, 2)}
    
    CRITERIOS DE REVISIÓN:
     1. ¿Están todos los rubros necesarios para una casa de ${blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0)}m² con estructura de ${blueprint.estructura}?
    2. ¿Faltan instalaciones críticas (Luz, Agua, Gas, Clima) mencionadas en el blueprint?
    3. ¿Los montos totales por categoría se ven realistas para el nivel ${blueprint.categoria}?
    4. CUMPLIMIENTO TÉCNICO: Si existen especificaciones técnicas a continuación, ¿el presupuesto las cumple?
    
    ESPECIFICACIONES TÉCNICAS (PLIEGO):
    ${blueprint.especificaciones_tecnicas ? blueprint.especificaciones_tecnicas.join('\n') : 'No se adjuntaron pliegos técnicos.'}
    
    Responde EXCLUSIVAMENTE en formato JSON:
    {
      "status": "aprobado" | "con_observaciones" | "critico",
      "alerta_roja": ["lista de errores graves u omisiones"],
      "sugerencias": ["lista de mejoras o detalles a considerar"]
    }
    
    Si falta algo fundamental o hay una contradicción directa con el pliego técnico, el status debe ser "critico".`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL.synthesis,
        max_tokens: 1000,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') throw new Error("Respuesta de QA no es texto");

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en respuesta de QA");

      return JSON.parse(jsonMatch[0]) as QAReport;
    } catch (error: any) {
      console.error("[QA Agent] Error con Anthropic:", error.message);
      
      if (OPENROUTER_ENABLED && OPENROUTER_API_KEY) {
        console.log("[QA Agent] Intentando con OpenRouter...");
        try {
          return await callOpenRouter(prompt);
        } catch (orError: any) {
          console.error("[QA Agent] OpenRouter falló:", orError.message);
        }
      }
      
      // Fallback a Ollama
      if (OLLAMA_ENABLED) {
        console.log("[QA Agent] Intentando con Ollama...");
        try {
          return await callOllama(prompt);
        } catch (ollamaError: any) {
          console.error("[QA Agent] Ollama falló:", ollamaError.message);
        }
      }
      
      return {
        status: 'con_observaciones',
        alerta_roja: [],
        sugerencias: ["No se pudo realizar la auditoría técnica automática."]
      };
    }
  }
}
