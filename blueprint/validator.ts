import { Blueprint, FACTOR_TERMINACION, Categoria } from "./schema";

const ERRORES: string[] = [];

function validarRequired(valor: any, campo: string): boolean {
  if (valor === undefined || valor === null || valor === "") {
    ERRORES.push(`Falta campo requerido: ${campo}`);
    return false;
  }
  return true;
}

function validarNumero(valor: any, campo: string, min: number, max: number): boolean {
  if (typeof valor !== "number") {
    ERRORES.push(`${campo} debe ser número`);
    return false;
  }
  if (valor < min || valor > max) {
    ERRORES.push(`${campo} debe estar entre ${min} y ${max}`);
    return false;
  }
  return true;
}

export function validarBlueprint(data: any): { valido: boolean; errores: string[]; blueprint?: Blueprint } {
  ERRORES.length = 0;

  if (!validarRequired(data, "id")) return { valido: false, errores: [...ERRORES] };
  // version es opcional al crear (se asigna en versioning.ts)
  if (!validarRequired(data, "usuario_id")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "estudio_id")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "fecha_creacion")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "nombre_obra")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "ubicacion")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "superficie_cubierta_m2")) return { valido: false, errores: [...ERRORES] };

  if (!validarNumero(data.superficie_cubierta_m2, "superficie_cubierta_m2", 10, 5000)) return { valido: false, errores: [...ERRORES] };
  if (data.superficie_semicubierta_m2 && !validarNumero(data.superficie_semicubierta_m2, "superficie_semicubierta_m2", 0, 1000)) {
    return { valido: false, errores: [...ERRORES] };
  }
  if (!validarNumero(data.plazo_meses, "plazo_meses", 1, 60)) return { valido: false, errores: [...ERRORES] };

  if (!validarRequired(data, "estructura")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "cubierta")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data, "categoria")) return { valido: false, errores: [...ERRORES] };

  if (!validarRequired(data, "terreno")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data.terreno, "tipo")) return { valido: false, errores: [...ERRORES] };
  if (!validarRequired(data.terreno, "zona_inundable")) return { valido: false, errores: [...ERRORES] };

  const categoriaValida: Categoria[] = ["economico", "estandar", "premium", "lujo"];
  if (!categoriaValida.includes(data.categoria)) {
    ERRORES.push(`Categoría inválida: ${data.categoria}`);
    return { valido: false, errores: [...ERRORES] };
  }
 
  const categoria = data.categoria as Categoria;
  const factorCalculado = FACTOR_TERMINACION[categoria];
  if (data.factor_terminacion !== factorCalculado) {
    // No es error, se corregirá automáticamente
    // ERRORES.push(`factor_terminacion incorrecto para categoría ${categoria}, debería ser ${factorCalculado}`);
  }

  if (data.terreno.zona_inundable === true) {
  }

  if (data.terreno.desnivel_metros && data.terreno.desnivel_metros > 1) {
  }

  if (data.terreno.requiere_demolicion === true) {
  }

  if (ERRORES.length > 0) {
    return { valido: false, errores: [...ERRORES] };
  }

  const blueprint: Blueprint = {
    ...data,
    version: data.version || 1,
    factor_terminacion: FACTOR_TERMINACION[categoria],
  };

  return { valido: true, errores: [], blueprint };
}