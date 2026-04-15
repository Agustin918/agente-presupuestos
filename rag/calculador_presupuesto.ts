import { ObraCliente, RubroCliente } from './parser_cliente';
import { PRECIOS_MATERIALES_2025, COSTO_POR_M2_2025, getPrecioMaterial } from '../data/precios_argentina';

const FACTOR_INFLACION_2012_2025 = 1000; // Aproximado: $1 en 2012 ≈ $1000 en 2025

export interface RubroPresupuesto {
  nombre: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
  fuente: string;
  ratio_historico?: number;
}

export interface ResumenObra {
  nombre: string;
  ubicacion?: string;
  superficie_m2: number;
  estructura: string;
  categoria: string;
  factor_terminacion: number;
  costo_m2_actualizado: number;
  costo_m2_historico: number;
  total_estimado: number;
  total_historico: number;
  inflacion_aplicada: number;
  rubros: RubroPresupuesto[];
}

function getFactorCategoria(categoria: string): number {
  const factores: Record<string, number> = {
    economico: 0.75,
    estandar: 1.0,
    premium: 1.4,
    lujo: 2.0,
  };
  return factores[categoria] || 1.0;
}

function getFactorEstructura(estructura: string): number {
  const factores: Record<string, number> = {
    albanileria: 1.0,
    hormigon_armado: 1.3,
    steel_frame: 1.15,
    madera: 1.2,
    mixto: 1.1,
  };
  return factores[estructura] || 1.0;
}

export function calcularPresupuestoConRatios(
  obra: ObraCliente,
  categoria: string = 'estandar',
  estructura: string = 'albanileria',
  precios2025?: Record<string, number>
): ResumenObra {
  const m2 = obra.superficie_total_m2 || obra.superficie_cubierta_m2;
  const factorCategoria = getFactorCategoria(categoria);
  const factorEstructura = getFactorEstructura(estructura);
  const factorInflacion = FACTOR_INFLACION_2012_2025;

  const rubros: RubroPresupuesto[] = [];
  let totalHistorico = 0;
  let totalActualizado = 0;

  for (const rubro of obra.rubros) {
    const ratioHistorico = m2 > 0 ? rubro.importe / m2 : 0;
    const ratioActualizado = ratioHistorico * factorInflacion * factorCategoria * factorEstructura;

    // Buscar precio unitario de material en 2025
    const precioMaterial2025 = buscarPrecioRubro(rubro.nombre);

    const rubroPresupuesto: RubroPresupuesto = {
      nombre: rubro.nombre,
      cantidad: m2,
      unidad: 'm2',
      precio_unitario: Math.round(ratioActualizado),
      subtotal: Math.round(ratioActualizado * m2),
      fuente: precioMaterial2025 ? 'Precio 2025' : 'Ratio actualizado',
      ratio_historico: Math.round(ratioHistorico),
    };

    rubros.push(rubroPresupuesto);
    totalHistorico += rubro.importe;
    totalActualizado += rubroPresupuesto.subtotal;
  }

  const costo_m2_historico = m2 > 0 ? totalHistorico / m2 : 0;
  const costo_m2_actualizado = m2 > 0 ? totalActualizado / m2 : 0;

  return {
    nombre: obra.nombre,
    ubicacion: obra.ubicacion,
    superficie_m2: m2,
    estructura,
    categoria,
    factor_terminacion: factorCategoria,
    costo_m2_historico: Math.round(costo_m2_historico),
    costo_m2_actualizado: Math.round(costo_m2_actualizado),
    total_estimado: Math.round(totalActualizado * factorCategoria),
    total_historico: Math.round(totalHistorico),
    inflacion_aplicada: factorInflacion,
    rubros,
  };
}

function buscarPrecioRubro(nombreRubro: string): number | null {
  const lower = nombreRubro.toLowerCase();

  // Mapeo de rubros a materiales con precios
  const mapeo: Record<string, string[]> = {
    materiales: ['cemento', 'arena', 'ladrillo', 'cal'],
    construccion: ['cemento', 'arena', 'ladrillo', 'hierro'],
    plomeria: ['cano', 'valvula', 'griferia'],
    electricidad: ['cable', 'tablero', 'techo'],
    sanitarios: ['inodoro', 'lavatorio', 'griferia'],
    pintura: ['pintura', 'latex', 'fijador'],
    techo: ['chapa', 'machimbre', 'tirante'],
    piso: ['ceramico', 'porcelanato', 'pisos'],
    calefaccion: ['cano', 'calefaccion'],
    herreria: ['hierro', 'acero'],
    madera: ['machimbre', 'liston', 'deck'],
    cocina: ['muebles'],
    piedra: ['piedra'],
    cerco: ['hierro', 'madera'],
  };

  for (const [key, materiales] of Object.entries(mapeo)) {
    if (lower.includes(key)) {
      for (const mat of materiales) {
        const precio = getPrecioMaterial(mat);
        if (precio) {
          return precio.precio;
        }
      }
    }
  }

  return null;
}

export function calcularCostoM2Argentina(
  ubicacion: string,
  estructura: string,
  categoria: string
): { costo_m2: number; fuente: string; detalle: string } {
  const base = COSTO_POR_M2_2025.bsas.precio; // Por defecto BS AS
  const factorEstructura = getFactorEstructura(estructura);
  const factorCategoria = getFactorCategoria(categoria);

  const costo_m2 = Math.round(base * factorEstructura * factorCategoria);

  return {
    costo_m2,
    fuente: 'CAPBA/APYMECO 2025 + ajustes',
    detalle: `Base ${ubicacion} x Estructura (${factorEstructura}) x Categoría (${factorCategoria})`,
  };
}

export function generarPresupuestoRapido(
  superficie_m2: number,
  estructura: string,
  categoria: string,
  ubicacion: string
): {
  costo_m2: number;
  total: number;
  desglose: { rubro: string; monto: number; porcentaje: number }[];
} {
  const { costo_m2 } = calcularCostoM2Argentina(ubicacion, estructura, categoria);
  const total = Math.round(costo_m2 * superficie_m2);

  // Desglose por rubro (% típico)
  const desglosePorRubro = getDesglosePorRubro(estructura, categoria);

  const desglose = desglosePorRubro.map(item => ({
    rubro: item.rubro,
    monto: Math.round(total * item.porcentaje / 100),
    porcentaje: item.porcentaje,
  }));

  return {
    costo_m2,
    total,
    desglose,
  };
}

function getDesglosePorRubro(estructura: string, categoria: string): { rubro: string; porcentaje: number }[] {
  // Porcentajes típicos de una vivienda
  const base = [
    { rubro: 'Estructura y Cimientos', porcentaje: 12 },
    { rubro: 'Mampostería / Tabiquería', porcentaje: 18 },
    { rubro: 'Cubierta y Techo', porcentaje: 8 },
    { rubro: 'Revestimientos', porcentaje: 8 },
    { rubro: 'Pisos', porcentaje: 10 },
    { rubro: 'Carpintería (Aberturas)', porcentaje: 10 },
    { rubro: 'Instalación Eléctrica', porcentaje: 6 },
    { rubro: 'Instalación Sanitaria', porcentaje: 6 },
    { rubro: 'Instalación de Gas', porcentaje: 3 },
    { rubro: 'Artefactos (Baños, Cocina)', porcentaje: 6 },
    { rubro: 'Pintura', porcentaje: 5 },
    { rubro: 'Oficios / Varios', porcentaje: 8 },
  ];

  // Ajustes por estructura
  if (estructura === 'steel_frame') {
    base.splice(1, 1, { rubro: 'Steel Frame', porcentaje: 20 }); // Reemplaza mampostería
    base.push({ rubro: 'Placas Durlock', porcentaje: 4 });
  }

  return base;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
