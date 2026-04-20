/**
 * BASE DE PRECIOS PARAMÉTRICOS EN USD
 * 
 * Precios de referencia en dólares USD (dólar blue ~$1400 ARS)
 * Basados en costos reales de mercado argentino 2026
 * 
 * Estos precios incluyen:
 * - Materiales
 * - Mano de obra
 * - Herramientas y equipos
 * 
 * No incluyen: GGU (Gastos Generales y Utilidad) - se calcula después
 */

export const PRECIOS_PARAMETRICOS_USD: Record<string, {
  precio: number;
  unidad: string;
  descripcion: string;
  incluye: string[];
}> = {
  // 01 - TRABAJOS PRELIMINARES
  "limpieza_terreno": {
    precio: 1.5,
    unidad: "m2",
    descripcion: "Limpieza y desmalezado del terreno",
    incluye: ["Mano de obra", "Herramientas"]
  },
  "replanteo": {
    precio: 2,
    unidad: "m2",
    descripcion: "Replanteo y nivación de obra",
    incluye: ["Mano de obra", "Malla", "Clavos", "Cal"]
  },
  "cartel_obra": {
    precio: 80,
    unidad: "un",
    descripcion: "Cartel de obra 2.00x1.00m",
    incluye: ["Cartel", "Estructura", "Instalación"]
  },

  // 02 - MOVIMIENTO DE TIERRAS
  "excavacion": {
    precio: 15,
    unidad: "m3",
    descripcion: "Excavación de zanjas para fundaciones",
    incluye: ["Mano de obra", "Equipo", "Transporte"]
  },
  "relleno_compactacion": {
    precio: 12,
    unidad: "m3",
    descripcion: "Relleno y compactación",
    incluye: ["Material granular", "Compactadora", "Mano de obra"]
  },

  // 03 - ESTRUCTURA RESISTENTE
  "hormigon_fundacion": {
    precio: 65,
    unidad: "m3",
    descripcion: "Hormigonado de zapata H21",
    incluye: ["Hormigon H21", "Acero", "Encofrado", "Mano de obra"]
  },
  "viga_fundacion": {
    precio: 55,
    unidad: "m3",
    descripcion: "Vigas de encadenado",
    incluye: ["Hormigon", "Acero", "Encofrado"]
  },
  "columna": {
    precio: 45,
    unidad: "m3",
    descripcion: "Columnas de elevación",
    incluye: ["Hormigon", "Acero", "Encofrado"]
  },
  "encadenado": {
    precio: 25,
    unidad: "ml",
    descripcion: "Encadenado perimetral",
    incluye: ["Hormigon", "Acero"]
  },

  // 04 - MAMPOSTERÍA
  "muro_elevacion": {
    precio: 28,
    unidad: "m2",
    descripcion: "Muro de elevación 20cm",
    incluye: ["Ladrillo", "Mortero", "Mano de obra"]
  },
  "tabique": {
    precio: 18,
    unidad: "m2",
    descripcion: "Tabique divisor 12cm",
    incluye: ["Ladrillo", "Mortero", "Mano de obra"]
  },

  // 05 - AISLACIONES
  "hidrofugo": {
    precio: 8,
    unidad: "m2",
    descripcion: "Barrera hidrofuga",
    incluye: ["Membrana", "Mano de obra"]
  },
  "aislante_termico": {
    precio: 10,
    unidad: "m2",
    descripcion: "Aislación térmica",
    incluye: ["Lana de vidrio o EPS", "Colocación"]
  },

  // 06 - CUBIERTA
  "estructura_cubierta": {
    precio: 30,
    unidad: "m2",
    descripcion: "Estructura de cubierta",
    incluye: ["Vigas", "Correas", "Fijaciones"]
  },
  "cubierta_chapa": {
    precio: 18,
    unidad: "m2",
    descripcion: "Cubierta de chapa",
    incluye: ["Chapa", "Tornillos", "Instalación"]
  },

  // 07 - REVOQUES
  "revoque_grueso": {
    precio: 12,
    unidad: "m2",
    descripcion: "Revoque грубый 15mm",
    incluye: ["Arena", "Cemento", "Malla", "Mano de obra"]
  },
  "revoque_fino": {
    precio: 10,
    unidad: "m2",
    descripcion: "Revoque fino 5mm",
    incluye: ["Arena fina", "Cemento", "Mano de obra"]
  },

  // 08 - CIELORRASO
  "cielorraso": {
    precio: 15,
    unidad: "m2",
    descripcion: "Cielorraso suspendido Durlock",
    incluye: ["Placas", "Perfiles", "Tornillos", "Mano de obra"]
  },

  // 09 - CONTRAPISO
  "contrapiso": {
    precio: 20,
    unidad: "m2",
    descripcion: "Contrapiso de hormigón",
    incluye: ["Hormigon", "Mano de obra"]
  },

  // 10 - PISOS
  "piso_ceramico": {
    precio: 28,
    unidad: "m2",
    descripcion: "Piso cerámico",
    incluye: ["Cerámico", "Pegamento", "Pastina", "Mano de obra"]
  },
  "piso_porcelanato": {
    precio: 45,
    unidad: "m2",
    descripcion: "Piso porcelanato",
    incluye: ["Porcelanato", "Pegamento C2", "Pastina", "Mano de obra"]
  },
  "zocalo": {
    precio: 5,
    unidad: "ml",
    descripcion: "Zócalo",
    incluye: ["Zócalo", "Pegamento"]
  },

  // 12 - INSTALACIÓN ELÉCTRICA
  "inst_electrica": {
    precio: 35,
    unidad: "boca",
    descripcion: "Punto eléctrico completo",
    incluye: ["Cable", "Caño", "Caja", "Interruptor", "Mano de obra"]
  },
  "tablero": {
    precio: 180,
    unidad: "un",
    descripcion: "Tablero eléctrico completo",
    incluye: ["Tablero", "Termomagnéticas", "Diferencial", "Instalación"]
  },

  // 13 - INSTALACIÓN SANITARIA
  "red_agua": {
    precio: 45,
    unidad: "punto",
    descripcion: "Punto de agua completo",
    incluye: ["Caños", "Válvulas", "Conexiones", "Mano de obra"]
  },
  "desague": {
    precio: 18,
    unidad: "ml",
    descripcion: "Desagüe",
    incluye: ["Caño PVC", "Botes sifonados", "Mano de obra"]
  },

  // 14 - INSTALACIÓN DE GAS
  "red_gas": {
    precio: 30,
    unidad: "ml",
    descripcion: "Red de gas",
    incluye: ["Caño gas", "Regulador", "Válvulas", "Mano de obra"]
  },

  // 16 - SANITARIOS
  "inodoro": {
    precio: 150,
    unidad: "un",
    descripcion: "Inodoro con depósito",
    incluye: ["Inodoro", "Asiento", "Flexibles", "Instalación"]
  },
  "lavatorio": {
    precio: 120,
    unidad: "un",
    descripcion: "Lavatorio o vanitory",
    incluye: ["Bacha", "Grifería", "Espejo", "Instalación"]
  },
  "ducha": {
    precio: 220,
    unidad: "un",
    descripcion: "Columna de ducha",
    incluye: ["Columna", "Grifería", "Receptor", "Instalación"]
  },
  "bidet": {
    precio: 100,
    unidad: "un",
    descripcion: "Bidet",
    incluye: ["Bidet", "Grifería", "Instalación"]
  },

  // 17 - CARPINTERÍA
  "puerta_interior": {
    precio: 120,
    unidad: "un",
    descripcion: "Puerta de interior",
    incluye: ["Puerta", "Marco", "Bisagras", "Cerradura"]
  },
  "ventana": {
    precio: 180,
    unidad: "un",
    descripcion: "Ventana aluminio DVH",
    incluye: ["Ventana", "Vidrio", "Burletes", "Instalación"]
  },
  "placard": {
    precio: 200,
    unidad: "un",
    descripcion: "Placard",
    incluye: ["Frente", "Interior", "Correderas", "Instalación"]
  },

  // 18 - PINTURA
  "pintura_interior": {
    precio: 8,
    unidad: "m2",
    descripcion: "Pintura látex interior",
    incluye: ["Látex", "Rodillo", "Pincel", "Mano de obra"]
  },
  "pintura_exterior": {
    precio: 10,
    unidad: "m2",
    descripcion: "Pintura látex exterior",
    incluye: ["Látex exterior", "Mano de obra"]
  },

  // 19 - LIMPIEZA
  "limpieza_final": {
    precio: 3,
    unidad: "m2",
    descripcion: "Limpieza final de obra",
    incluye: ["Mano de obra", "Insumos limpieza"]
  },

  // EXTRAS
  "aire_acondicionado": {
    precio: 280,
    unidad: "un",
    descripcion: "Split inverter frío/calor",
    incluye: ["Equipo", "Instalación", "Gas"]
  },
  "termotanque": {
    precio: 200,
    unidad: "un",
    descripcion: "Termotanque a gas",
    incluye: ["Termotanque", "Instalación", "Ventilación"]
  },
};

/**
 * Factores de terminación por categoría
 */
export const FACTORES_TERMINACION: Record<string, number> = {
  economico: 0.8,
  estandar: 1.0,
  premium: 1.35,
  lujo: 2.0
};

/**
 * Ajustes de precio por categoría para cada rubro
 */
export const AJUSTES_POR_CATEGORIA: Record<string, Record<string, number>> = {
  piso: {
    economico: 0.7,    // Cerámico económico
    estandar: 1.0,     // Cerámico estándar
    premium: 1.5,       // Porcelanato
    lujo: 2.2          // Porcelanato importado
  },
  abertura: {
    economico: 0.8,    // Aluminum básico
    estandar: 1.0,     // Aluminum DVH
    premium: 1.4,      // PVC
    lujo: 1.8         // Madera premium
  },
  pintura: {
    economico: 0.8,    // Latex económica
    estandar: 1.0,     // Latex estándar
    premium: 1.3,      // Latex premium
    lujo: 1.6         // Esmalte sintetico
  },
  sanitarios: {
    economico: 0.75,
    estandar: 1.0,
    premium: 1.4,
    lujo: 2.0
  },
  griferia: {
    economico: 0.7,
    estandar: 1.0,
    premium: 1.5,
    lujo: 2.0
  }
};

/**
 * Obtiene el precio paramétrico para un rubro específico
 */
export function getPrecioParametrico(rubro: string): number {
  const precio = PRECIOS_PARAMETRICOS_USD[rubro];
  return precio?.precio || 10;
}

/**
 * Obtiene el precio ajustado por categoría de terminación
 */
export function getPrecioPorCategoria(rubro: string, categoria: string): number {
  const precioBase = getPrecioParametrico(rubro);
  const ajuste = AJUSTES_POR_CATEGORIA[rubro]?.[categoria] || 1.0;
  return precioBase * ajuste;
}