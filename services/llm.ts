import { Anthropic } from '@anthropic-ai/sdk';
import { Blueprint, ItemPresupuesto } from '../blueprint/schema';
import { ANTHROPIC_API_KEY } from '../config/settings';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export async function generateBudgetItems(
  blueprint: Blueprint,
  precios: Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }>,
  obrasSimilares: any[]
): Promise<ItemPresupuesto[]> {
  if (!ANTHROPIC_API_KEY) {
    console.log('[LLM] Sin API key, usando mock');
    return generateMockItems(blueprint, precios);
  }

  const prompt = `Eres un experto en construcción y presupuestos. Genera una lista de ítems para un presupuesto de vivienda con las siguientes características:

- Estructura: ${blueprint.estructura}
- Superficie cubierta: ${blueprint.superficie_cubierta_m2} m²
- Categoría: ${blueprint.categoria}
- Plantas: ${blueprint.plantas}
- Cubierta: ${blueprint.cubierta}
- Pisos: ${blueprint.pisos}
- Aberturas: ${blueprint.aberturas}
- Instalaciones: ${blueprint.instalaciones?.join(', ')}

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

  try {
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

    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) || content.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('No se encontró JSON en la respuesta');
    }

    const items = JSON.parse(jsonMatch[0]);
    return items.map((item: any) => ({
      rubro: item.rubro,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
      fuente: item.fuente,
      fecha_precio: new Date().toISOString().split('T')[0],
      confianza: item.confianza || 'media',
      nota_confianza: item.nota_confianza,
      precio_desactualizado: false,
    }));
  } catch (error) {
    console.error('[LLM] Error generando items:', error);
    return generateMockItems(blueprint, precios);
  }
}

function generateMockItems(blueprint: Blueprint, precios: Record<string, any>): ItemPresupuesto[] {
  // Mock simple basado en superficie
  const items = [
    { rubro: 'Cimientos', descripcion: 'Hormigón armado', unidad: 'm³', factor: 0.3 },
    { rubro: 'Muros', descripcion: 'Ladrillo común', unidad: 'm²', factor: 2.5 },
    { rubro: 'Cubierta', descripcion: 'Estructura de madera y chapa', unidad: 'm²', factor: 1 },
    { rubro: 'Pisos', descripcion: 'Cerámico', unidad: 'm²', factor: 1 },
    { rubro: 'Aberturas', descripcion: 'Ventanas de aluminio', unidad: 'un', factor: 0.15 },
    { rubro: 'Instalación eléctrica', descripcion: 'Cableado y tablero', unidad: 'm²', factor: 0.1 },
    { rubro: 'Instalación sanitaria', descripcion: 'Cañerías y grifería', unidad: 'm²', factor: 0.08 },
    { rubro: 'Pintura', descripcion: 'Interior y exterior', unidad: 'm²', factor: 0.5 },
  ];

  return items.map(item => {
    const cantidad = item.factor * blueprint.superficie_cubierta_m2;
    const precio = precios[item.rubro.toLowerCase()]?.precio || 1000;
    return {
      rubro: item.rubro,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: Math.round(cantidad * 100) / 100,
      precio_unitario: precio,
      subtotal: Math.round(cantidad * precio * 100) / 100,
      fuente: 'estimado',
      fecha_precio: new Date().toISOString().split('T')[0],
      confianza: 'media',
      nota_confianza: 'Generado por mock',
      precio_desactualizado: false,
    };
  });
}