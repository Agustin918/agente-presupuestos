export type TipoEstructura = "steel_frame" | "hormigon_armado" | "albanileria" | "madera" | "mixto";
export type TipoCubierta = "chapa_trapezoidal" | "chapa_acanalada" | "membrana_losa" | "teja_ceramica" | "techo_verde";
export type Categoria = "economico" | "estandar" | "premium" | "lujo";
export type TipoPisos = "porcelanato" | "ceramico" | "madera" | "microcemento" | "a_definir";
export type TipoCielorraso = "suspendido" | "aplicado" | "madera" | "a_la_vista";
export type TipoAberturas = "aluminio_basico" | "aluminio_dvh" | "pvc" | "madera";
export type TipoTerreno = "lote_propio" | "barrio_cerrado" | "country" | "ph" | "otro";
export type Modalidad = "llave_en_mano" | "administracion" | "solo_materiales";
export type Plantas = 1 | 2 | 3 | "pb_semisotano";
export type TienePlanos = "aprobados" | "anteproyecto" | "sin_planos";
export type Instalacion = "electrica" | "sanitaria" | "gas" | "calefaccion_radiante" | "aire_acondicionado" | "domotica" | "paneles_solares" | "pileta";
export type CalentadorAgua = "termotanque_gas" | "termotanque_electrico" | "heat_pump" | "solar";
export type TipoCochera = "cubierta" | "semicubierta" | "sin_techar";
export type TipoEscalera = "hormigon" | "metalica" | "madera";
export type RevestimientoExterior = "revoque_fino" | "piedra" | "ladrillo_visto" | "simil_piedra" | "chapa" | "mixto";
export type MaterialCerco = "mamposteria" | "metalico" | "madera" | "mixto";

export const FACTOR_TERMINACION: Record<Categoria, number> = {
  economico: 1.0,
  estandar: 1.35,
  premium: 1.8,
  lujo: 2.5,
};

export interface Terreno {
  tipo: TipoTerreno;
  desnivel_metros?: number;
  zona_inundable?: boolean;
  restricciones_altura?: number;
  requiere_demolicion?: boolean;
}

export interface Blueprint {
  id: string;
  version: number;
  version_anterior_id?: string;
  usuario_id: string;
  estudio_id: string;
  fecha_creacion: string;
  escenarios?: boolean;
  
  archivos_fuente?: string[];
  confianza_extraccion?: Record<string, "alta" | "media" | "baja" | "manual">;

  nombre_obra: string;
  ubicacion: string;
  superficie_cubierta_m2: number;
  superficie_semicubierta_m2?: number;
  plantas: Plantas;
  tiene_planos: TienePlanos;

  dormitorios: 1 | 2 | 3 | 4 | 5;
  cantidad_banos: 1 | 2 | 3 | 4;
  tiene_cochera: boolean;
  tipo_cochera?: TipoCochera;
  tiene_quincho: boolean;
  tiene_galeria: boolean;
  tiene_deck: boolean;
  superficie_deck_m2?: number;
  cocina_equipada: boolean;

  estructura: TipoEstructura;
  panel_espesor?: 89 | 140;
  cubierta: TipoCubierta;
  tiene_escalera: boolean;
  tipo_escalera?: TipoEscalera;

  categoria: Categoria;
  factor_terminacion: number;
  pisos: TipoPisos;
  cielorraso: TipoCielorraso;
  aberturas: TipoAberturas;

  revestimiento_exterior: RevestimientoExterior;
  porton_cerco: boolean;
  material_cerco?: MaterialCerco;

  instalaciones: Instalacion[];
  calentador_agua: CalentadorAgua;
  tiene_cisterna: boolean;
  tiene_tanque_elevado: boolean;

  terreno: Terreno;

  plazo_meses: number;
  modalidad: Modalidad;
  observaciones?: string;
}

export interface PrecioCache {
  [material: string]: {
    precio: number;
    unidad: string;
    fuente_url: string;
    fuente_nombre?: string;
    fecha: string;
    vigente: boolean;
    precio_desactualizado?: boolean;
  };
}

export interface ObraHistorica {
  id: string;
  nombre: string;
  fecha_cierre: string;
  estudio_id: string;
  estructura: string;
  superficie_m2: number;
  categoria: string;
  ubicacion: string;
  ratios: Record<string, number>;
  desvio_estimado_real: number;
  observaciones: string;
}

export interface VersionPresupuesto {
  version: number;
  fecha: string;
  blueprint_id: string;
  total: number;
  cambios_vs_anterior?: {
    campo: string;
    valor_anterior: any;
    valor_nuevo: any;
    impacto_precio: number;
    impacto_porcentaje: number;
  }[];
  resumen_cambios?: string;
}

export interface ItemPresupuesto {
  rubro: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fuente: string;
  fecha_precio: string;
  confianza: "alta" | "media" | "baja";
  nota_confianza?: string;
  precio_desactualizado?: boolean;
}

export interface Presupuesto {
  obra: string;
  fecha: string;
  superficie_m2: number;
  estructura: string;
  categoria: string;
  factor_terminacion: number;
  total_estimado: number;
  items: ItemPresupuesto[];
  precios_frescos: number;
  precios_cache: number;
  precios_vencidos: number;
}

export interface PresupuestoComparativo {
  obra: string;
  fecha: string;
  escenarios: {
    categoria: string;
    factor: number;
    total_estimado: number;
    diferencia_vs_economico: string;
    items_que_mas_cambian: string[];
  }[];
}

export interface ExtractionResult {
  blueprint_parcial: Partial<Blueprint>;
  confianza: Record<string, "alta" | "media" | "baja" | "no_detectado">;
  archivos_procesados: string[];
  notas_extraccion: string[];
}