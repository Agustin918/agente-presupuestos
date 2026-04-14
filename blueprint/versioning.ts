import { Blueprint, VersionPresupuesto } from "./schema";

export function calcularCambios(
  anterior: Blueprint,
  nuevo: Blueprint
): VersionPresupuesto["cambios_vs_anterior"] {
  const cambios = [];

  const campos = Object.keys(nuevo) as (keyof Blueprint)[];

  for (const campo of campos) {
    const valorAnterior = anterior[campo];
    const valorNuevo = nuevo[campo];

    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
      cambios.push({
        campo: campo as string,
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
        impacto_precio: 0,
        impacto_porcentaje: 0,
      });
    }
  }

  return cambios;
}

export function calcularImpactoPrecio(
  cambios: VersionPresupuesto["cambios_vs_anterior"],
  totalAnterior: number,
  totalNuevo: number
): VersionPresupuesto["cambios_vs_anterior"] {
  if (!cambios) return cambios;
  const diffTotal = totalNuevo - totalAnterior;
  
  if (cambios.length === 0 || diffTotal === 0) {
    return cambios;
  }

  const cambiosConImpacto = cambios.map(cambio => ({
    ...cambio,
    impacto_precio: Math.round(diffTotal / cambios.length),
    impacto_porcentaje: Math.round((diffTotal / totalAnterior) * 100 / cambios.length),
  }));

  return cambiosConImpacto;
}

export function generarResumenCambios(cambios: VersionPresupuesto["cambios_vs_anterior"]): string {
  if (!cambios || cambios.length === 0) {
    return "Sin cambios";
  }

  const cambiosPrincipales = cambios.slice(0, 3);
  const textos = cambiosPrincipales.map(c => `${c.campo}: ${c.valor_anterior} → ${c.valor_nuevo}`);
  
  if (cambios.length > 3) {
    textos.push(`y ${cambios.length - 3} cambios más`);
  }

  return textos.join("; ");
}

export function crearNuevaVersion(
  anterior: Blueprint,
  nuevo: Blueprint,
  totalAnterior: number,
  totalNuevo: number
): VersionPresupuesto {
  const cambios = calcularCambios(anterior, nuevo);
  const cambiosConImpacto = calcularImpactoPrecio(cambios, totalAnterior, totalNuevo);
  const resumen = generarResumenCambios(cambiosConImpacto);

  return {
    version: nuevo.version,
    fecha: nuevo.fecha_creacion,
    blueprint_id: nuevo.id,
    total: totalNuevo,
    cambios_vs_anterior: cambiosConImpacto,
    resumen_cambios: resumen,
  };
}