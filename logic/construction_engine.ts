import { Blueprint, ItemPresupuesto } from "../blueprint/schema";

/**
 * ENGINE TÉCNICO DE CONSTRUCCIÓN
 * Centraliza las fórmulas, ratios y validaciones físicas de la obra.
 */

// Ratios base (valores promedio mercado Argentina)
export const RATIOS_BASE = {
  HORMIGON_M3_POR_M2: 0.18,      // 0.15 - 0.22 m3 por m2 de obra
  ACERO_KG_POR_M2: 25,           // 20 - 35 kg de hierro por m2
  LADRILLOS_18_POR_M2: 15,       // Unidades por m2 de muro de 18
  CEMENTO_BOLSAS_POR_M2: 0.8,    // Bolsas de 50kg por m2 total
  MANO_OBRA_HORAS_POR_M2: 80,    // Estimativo global
};

export interface ValidacionTecnica {
  resultado: 'ok' | 'alerta' | 'critico';
  mensajes: string[];
  desvios: Record<string, number>;
}

export class ConstructionEngine {
  /**
   * Valida si la lista de ítems generada tiene consistencia física con el blueprint.
   */
  static validarConsistencia(blueprint: Blueprint, items: ItemPresupuesto[]): ValidacionTecnica {
    const mensajes: string[] = [];
    const desvios: Record<string, number> = {};
    const superficie = blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0);

    // 1. Validar Volumen de Hormigón
    const totalHormigon = items
      .filter(i => i.rubro.toLowerCase().includes('hormigón') || i.descripcion.toLowerCase().includes('h21'))
      .reduce((sum, i) => sum + i.cantidad, 0);
    
    const hormigonEstimado = superficie * RATIOS_BASE.HORMIGON_M3_POR_M2;
    if (totalHormigon < hormigonEstimado * 0.7) {
      mensajes.push(`⚠️ Alerta: El volumen de hormigón (${totalHormigon}m³) parece muy bajo para ${superficie}m². Se esperaban al menos ${Math.round(hormigonEstimado)}m³.`);
      desvios['hormigon'] = totalHormigon / hormigonEstimado;
    }

    // 2. Validar Presencia de Acero
    const tieneAcero = items.some(i => i.rubro.toLowerCase().includes('hierro') || i.descripcion.toLowerCase().includes('acero'));
    if (!tieneAcero) {
      mensajes.push('❌ Crítico: No se detectaron ítems de Hierro/Acero en el presupuesto. La estructura podría estar incompleta.');
    }

    // 3. Validar Instalaciones Críticas
    const instalaciones = blueprint.instalaciones || [];
    instalaciones.forEach(inst => {
      const tieneInst = items.some(i => i.rubro.toLowerCase().includes(inst.toLowerCase()) || i.categoria?.toLowerCase().includes(inst.toLowerCase()));
      if (!tieneInst) {
        mensajes.push(`⚠️ Alerta: No se encontró el rubro de instalación '${inst}' solicitada en el blueprint.`);
      }
    });

    // 4. Validar costo por m² realista según categoría
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    const costoPorM2 = superficie > 0 ? total / superficie : 0;
    const rangosPorCategoria: Record<string, { min: number; max: number }> = {
      economico: { min: 150, max: 250 },
      estandar: { min: 200, max: 350 },
      premium: { min: 300, max: 500 },
      lujo: { min: 450, max: 700 },
    };
    const rango = rangosPorCategoria[blueprint.categoria];
    if (rango) {
      if (costoPorM2 < rango.min) {
        mensajes.push(`⚠️ Alerta: Costo por m² ($${costoPorM2.toFixed(2)} USD) está por debajo del rango esperado para categoría ${blueprint.categoria} ($${rango.min}-${rango.max} USD). Puede faltar rubros o precios están subestimados.`);
      } else if (costoPorM2 > rango.max) {
        mensajes.push(`⚠️ Alerta: Costo por m² ($${costoPorM2.toFixed(2)} USD) excede el rango esperado para categoría ${blueprint.categoria} ($${rango.min}-${rango.max} USD). Puede haber sobreestimación o precios inflados.`);
      }
    }

    return {
      resultado: mensajes.some(m => m.includes('Crítico')) ? 'critico' : mensajes.length > 0 ? 'alerta' : 'ok',
      mensajes,
      desvios
    };
  }

  /**
   * Genera recomendaciones de cantidades basadas en ratios matemáticos.
   * Se usa para "sembrar" el prompt de la IA con valores realistas.
   */
  static obtenerEstimacionesBase(blueprint: Blueprint) {
    const s = blueprint.superficie_cubierta_m2 + (blueprint.superficie_semicubierta_m2 || 0);
    return {
      hormigon_total: Math.round(s * RATIOS_BASE.HORMIGON_M3_POR_M2),
      acero_total: Math.round(s * RATIOS_BASE.ACERO_KG_POR_M2),
      cemento_total: Math.round(s * RATIOS_BASE.CEMENTO_BOLSAS_POR_M2)
    };
  }
}
