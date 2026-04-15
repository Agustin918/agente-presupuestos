import { Blueprint, ItemPresupuesto } from '../blueprint/schema';
import { OLLAMA_URL, OLLAMA_MODEL, ANTHROPIC_API_KEY } from '../config/settings';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export type LLMProvider = 'anthropic' | 'ollama' | 'mock';

export async function generateBudgetItems(
  blueprint: Blueprint,
  precios: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }>,
  obrasSimilares: any[]
): Promise<ItemPresupuesto[]> {
  const prompt = buildPrompt(blueprint, precios, obrasSimilares);

  // Intentar Anthropic primero si hay API key
  if (ANTHROPIC_API_KEY) {
    try {
      return await callAnthropic(prompt);
    } catch (error) {
      console.log('[LLM] Anthropic falló, probando Ollama...');
    }
  }

  // Intentar Ollama
  try {
    return await callOllama(prompt);
  } catch (error) {
    console.log('[LLM] Ollama falló, usando mock...');
  }

  // Fallback a mock
  return generateMockItems(blueprint, precios);
}

function buildPrompt(blueprint: Blueprint, precios: Record<string, any>, obrasSimilares: any[]): string {
  return `Eres un experto en construcción y presupuestos. Genera una lista de ítems para un presupuesto de vivienda con las siguientes características:

- Estructura: ${blueprint.estructura}
- Superficie cubierta: ${blueprint.superficie_cubierta_m2} m²
${blueprint.superficie_semicubierta_m2 ? `- Superficie semicubierta: ${blueprint.superficie_semicubierta_m2} m²` : ''}
- Categoría: ${blueprint.categoria}
- Factor terminación: ${blueprint.factor_terminacion}
- Plantas: ${blueprint.plantas}
- Cubierta: ${blueprint.cubierta}
- Pisos: ${blueprint.pisos}
- Aberturas: ${blueprint.aberturas}
- Instalaciones: ${blueprint.instalaciones?.join(', ') || 'Ninguna'}
${blueprint.terreno?.zona_inundable ? '- ⚠️ Zona inundable (agregar hidrofuga)' : ''}
${(blueprint.terreno?.desnivel_metros || 0) > 1 ? `- ⚠️ Desnivel ${blueprint.terreno.desnivel_metros}m (agregar movimiento de suelos)` : ''}

Precios disponibles:
${Object.entries(precios).map(([mat, info]) => `- ${mat}: $${info.precio} por ${info.unidad}`).join('\n')}

Obras históricas similares: ${obrasSimilares.length} obras.

Genera un array JSON de ítems con los siguientes campos para cada ítem:
- rubro: nombre del rubro (ej: "Cimientos", "Muros", "Cubierta")
- descripcion: descripción breve
- unidad: unidad de medida (m², m, un, kg)
- cantidad: cantidad estimada basada en superficie y características
- precio_unitario: tomar del precio correspondiente si existe, sino estimar
- subtotal: cantidad * precio_unitario
- fuente: "precio_actual" o "estimado"
- fecha_precio: fecha del precio (usar hoy)
- confianza: "alta", "media", "baja"
- nota_confianza: explicación

Devuelve solo el array JSON, sin texto adicional.`;
}

async function callAnthropic(prompt: string): Promise<ItemPresupuesto[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Respuesta no es texto');
  }

  return parseLLMResponse(content.text);
}

async function callOllama(prompt: string): Promise<ItemPresupuesto[]> {
  const model = OLLAMA_MODEL || 'llama3.2';
  
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json() as { response: string };
  console.log('[Ollama] Respuesta recibida, intentando parsear...');
  return parseLLMResponse(data.response);
}

function parseLLMResponse(text: string): ItemPresupuesto[] {
  // Intentar múltiples patrones para encontrar JSON
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /\[\s*\{[\s\S]*\}\s*\]/,
    /\{[\s\S]*"rubro"[\s\S]*\}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        const cleaned = jsonStr.replace(/[\n\r]+/g, ' ').trim();
        const items = JSON.parse(cleaned);
        
        if (Array.isArray(items) || items.rubro) {
          console.log('[LLM] JSON parseado correctamente');
          return (Array.isArray(items) ? items : [items]).map((item: any) => ({
            rubro: item.rubro || item.Rubro || 'General',
            descripcion: item.descripcion || item.Descripcion || item.desc || '',
            unidad: item.unidad || item.Unidad || 'un',
            cantidad: Number(item.cantidad) || 1,
            precio_unitario: Number(item.precio_unitario) || Number(item.precio) || 1000,
            subtotal: Number(item.subtotal) || Number(item.total) || 1000,
            fuente: item.fuente || 'llm',
            fecha_precio: new Date().toISOString().split('T')[0],
            confianza: item.confianza || item.conf || 'media',
            nota_confianza: item.nota_confianza || item.nota || 'Generado por IA',
            precio_desactualizado: false,
          }));
        }
      } catch (e) {
        console.log('[LLM] Falló parseo JSON:', (e as Error).message);
      }
    }
  }

  // Si no se pudo parsear, extraer números y crear items básicos
  console.log('[LLM] No se pudo parsear JSON, usando extracción inteligente');
  return extractItemsFromText(text);
}

function extractItemsFromText(text: string): ItemPresupuesto[] {
  // Patrones comunes en respuestas de IA
  const lines = text.split(/[\n,;]/).filter(l => l.trim());
  const items: ItemPresupuesto[] = [];
  
  const rubrosComunes = ['Cimientos', 'Muros', 'Estructura', 'Cubierta', 'Pisos', 
    'Aberturas', 'Electricidad', 'Sanitaria', 'Gas', 'Pintura', 'Revestimiento', 'Cielorraso'];
  
  for (const line of lines) {
    for (const rubro of rubrosComunes) {
      if (line.toLowerCase().includes(rubro.toLowerCase())) {
        const numeros = line.match(/\d+/g);
        const precio = numeros ? parseInt(numeros[0]) * 1000 : 1000;
        
        items.push({
          rubro,
          descripcion: line.substring(0, 50),
          unidad: 'm²',
          cantidad: 10,
          precio_unitario: precio,
          subtotal: precio * 10,
          fuente: 'llm',
          fecha_precio: new Date().toISOString().split('T')[0],
          confianza: 'media',
          nota_confianza: 'Extraído de respuesta LLM',
          precio_desactualizado: false,
        });
        break;
      }
    }
  }

  // Si no se extrajo nada, usar mock
  if (items.length === 0) {
    throw new Error('No se pudo extraer información útil');
  }

  return items;
}

function generateMockItems(blueprint: Blueprint, precios: Record<string, any>): ItemPresupuesto[] {
  const items = [
    { rubro: 'Cimientos', descripcion: 'Hormigón armado H21', unidad: 'm³', factor: 0.3 },
    { rubro: 'Muros', descripcion: `${blueprint.estructura === 'albanileria' ? 'Ladrillo hueco 18cm' : 'Steel frame'}`, unidad: 'm²', factor: 2.5 },
    { rubro: 'Estructura', descripcion: `${blueprint.estructura} - ${blueprint.plantas} plantas`, unidad: 'm²', factor: 1.2 },
    { rubro: 'Cubierta', descripcion: `${blueprint.cubierta}`, unidad: 'm²', factor: 1.1 },
    { rubro: 'Pisos', descripcion: `${blueprint.pisos}`, unidad: 'm²', factor: 1 },
    { rubro: 'Aberturas', descripcion: `${blueprint.aberturas}`, unidad: 'un', factor: 0.15 },
    { rubro: 'Instalación eléctrica', descripcion: 'Completa con cables y tableros', unidad: 'm²', factor: 1 },
    { rubro: 'Instalación sanitaria', descripcion: 'Cañerías, desagües y grifería', unidad: 'm²', factor: 0.8 },
    { rubro: 'Instalación gas', descripcion: 'Cañería y reguladores', unidad: 'm²', factor: 0.5 },
    { rubro: 'Cielorraso', descripcion: `${blueprint.cielorraso}`, unidad: 'm²', factor: 1 },
    { rubro: 'Pintura', descripcion: 'Interior y exterior', unidad: 'm²', factor: 3.5 },
    { rubro: 'Revestimiento', descripcion: `${blueprint.revestimiento_exterior}`, unidad: 'm²', factor: 1.2 },
  ];

  if (blueprint.terreno?.zona_inundable) {
    items.push({ rubro: 'Hidrofuga', descripcion: 'Carpeta hidrofuga y pilotes', unidad: 'm²', factor: 0.5 });
  }

  if ((blueprint.terreno?.desnivel_metros || 0) > 1) {
    items.push({ rubro: 'Movimiento de suelos', descripcion: 'Nivelación y terraplenado', unidad: 'm³', factor: 0.3 });
  }

  const total = items.reduce((sum, item) => sum + item.factor * blueprint.superficie_cubierta_m2 * 1000, 0);
  const factorCategoria = blueprint.factor_terminacion || 1;

  return items.map(item => {
    const cantidad = item.factor * blueprint.superficie_cubierta_m2;
    const precioBase = precios[item.rubro.toLowerCase()]?.precio || (1000 + Math.random() * 500);
    const precioUnitario = Math.round(precioBase * factorCategoria);
    
    return {
      rubro: item.rubro,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: Math.round(cantidad * 100) / 100,
      precio_unitario: Math.round(precioUnitario),
      subtotal: Math.round(cantidad * precioUnitario),
      fuente: precios[item.rubro.toLowerCase()] ? 'precio_actual' : 'estimado',
      fecha_precio: new Date().toISOString().split('T')[0],
      confianza: precios[item.rubro.toLowerCase()] ? 'alta' : 'media',
      nota_confianza: precios[item.rubro.toLowerCase()] ? 'Precio de caché' : 'Estimado por superficie',
      precio_desactualizado: false,
    };
  });
}

export const llmService = {
  generateBudgetItems,
  callAnthropic,
  callOllama,
};
