import { Blueprint, Presupuesto } from "../blueprint/schema";
import { Anthropic } from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, MODEL } from "../config/settings";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

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
    } catch (error) {
      console.error("[QA Agent] Error en revisión:", error);
      return {
        status: 'con_observaciones',
        alerta_roja: [],
        sugerencias: ["No se pudo realizar la auditoría técnica automática."]
      };
    }
  }
}
