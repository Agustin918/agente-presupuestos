// FUENTES DE INFORMACIÓN PARA PRESUPUESTOS DE CONSTRUCCIÓN EN ARGENTINA
// Actualizado: Abril 2026

export interface FuenteInfo {
  nombre: string;
  url: string;
  descripcion: string;
  tipo: 'precio_m2' | 'materiales' | 'indices' | 'mano_obra' | 'referencia';
  ultima_consulta: string;
}

export const FUENTES_WEB: FuenteInfo[] = [
  // PRECIOS POR M²
  {
    nombre: 'APYMECO - Colegio Arquitectos La Plata',
    url: 'https://www.capba.org.ar/',
    descripcion: 'Índice de costos y precio m² para Gran La Plata. Enero 2025: $1.620.901/m²',
    tipo: 'precio_m2',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'CAPC - Colegio Arquitectos Córdoba',
    url: 'https://www.capc.org.ar/',
    descripcion: 'Costo m² Córdoba 2025: Tradicional $1.536.935/m², Steel Frame $1.658.191/m²',
    tipo: 'precio_m2',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'AyC Revista - Arquitectura y Construcción',
    url: 'https://aycrevista.com.ar/',
    descripcion: 'Precios de construcción actualizados mensuales + fichas de materiales',
    tipo: 'precio_m2',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Arquitectura y Construcción Digital',
    url: 'https://arquitecturayconstrucciondigital.com/',
    descripcion: 'Evolución del costo m² en Argentina, gráficos e índices',
    tipo: 'indices',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Info Construcción',
    url: 'https://infoconstruccion.com.ar/',
    descripcion: 'Precios actualizados de materiales y mano de obra',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },

  // PRECIOS DE MATERIALES
  {
    nombre: 'Easy Home Store',
    url: 'https://www.easy.com.ar/',
    descripcion: 'Corralón con precios de materiales de construcción, electricidad, plomería',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'La Pista 26',
    url: 'https://www.lapistay26.com.ar/',
    descripcion: 'Pisos y revestimientos, cerámica, porcelanato, gres',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Construnort',
    url: 'https://www.construnort.com.ar/',
    descripcion: 'Corralón construcción: pisos, revestimientos, materiales generales',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Hauster Maderera',
    url: 'https://hauster.com.ar/',
    descripcion: 'Maderas para construcción, decks, revestimientos, tirantes',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Jaque Mate',
    url: 'https://www.jaquemate.com.ar/',
    descripcion: 'Sanitarios, griferías, inodoros, lavatorios, vanitorys',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Edificor',
    url: 'https://www.edificor.com.ar/',
    descripcion: 'Pisos, revestimientos, materiales de construcción',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Mercado Libre',
    url: 'https://www.mercadolibre.com.ar/',
    descripcion: 'Precios de referencia para casi todos los materiales',
    tipo: 'materiales',
    ultima_consulta: '2026-04-15',
  },

  // ÍNDICES Y COSTOS
  {
    nombre: 'INDEC - Índice Costo Construcción',
    url: 'https://www.indec.gob.ar/',
    descripcion: 'ICC Gran Buenos Aires, variación mensual e interanual',
    tipo: 'indices',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'IECyBA - Instituto Estadística CABA',
    url: 'https://www.estadisticaciudad.gob.ar/',
    descripcion: 'Índice del Costo de la Construcción Ciudad de Buenos Aires',
    tipo: 'indices',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'CPAU - Consejo Profesional Arquitectura',
    url: 'https://www.cpau.org/',
    descripcion: 'Índices y costos de construcción CABA y GBA, mensual',
    tipo: 'indices',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'CAMARCO',
    url: 'https://www.camarco.org.ar/',
    descripcion: 'Cámara Argentina de la Construcción - estadísticas y costos',
    tipo: 'indices',
    ultima_consulta: '2026-04-15',
  },

  // MANO DE OBRA
  {
    nombre: 'UOCRA',
    url: 'https://www.uocra.org/',
    descripcion: 'Escalas salariales, básico por categoría,坏死',
    tipo: 'mano_obra',
    ultima_consulta: '2026-04-15',
  },

  // REFERENCIA GENERAL
  {
    nombre: 'Colaso Construcciones',
    url: 'https://colaso.com.ar/',
    descripcion: 'Guía de costos por m² 2025, desglose por etapas',
    tipo: 'referencia',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Todo Calculadoras',
    url: 'https://todocalculadoras.com.ar/',
    descripcion: 'Calculadora de costos construcción Tandil y zona',
    tipo: 'referencia',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'Construcción y Arquitectura Patagónica',
    url: 'https://construccionyarquitecturapatagonica.com/',
    descripcion: 'Costos por m² en Patagonia Argentina',
    tipo: 'referencia',
    ultima_consulta: '2026-04-15',
  },
  {
    nombre: 'LA NACIÓN - Sección Construcción',
    url: 'https://www.lanacion.com.ar/',
    descripcion: 'Noticias sobre costos construcción y mercado inmobiliario',
    tipo: 'referencia',
    ultima_consulta: '2026-04-15',
  },
];

// PRECIOS ACTUALES DE MATERIALES (Abril 2026)
export const PRECIOS_MATERIALES_ACTUALIZADOS = {
  // Cemento y Cal
  cemento_50kg: { precio: 11500, unidad: 'bolsa', fuente: 'Info Construcción' },
  cal_30kg: { precio: 8500, unidad: 'bolsa', fuente: 'Info Construcción' },

  // Arena y Piedra
  arena_m3: { precio: 42000, unidad: 'm3', fuente: 'Info Construcción' },
  piedra_partida_m3: { precio: 100000, unidad: 'm3', fuente: 'Info Construcción' },

  // Ladrillos
  ladrillo_comun_1000: { precio: 220000, unidad: '1000', fuente: 'Info Construcción' },
  ladrillo_hueco_12: { precio: 1400, unidad: 'unidad', fuente: 'Info Construcción' },
  ladrillo_hueco_18: { precio: 2000, unidad: 'unidad', fuente: 'Info Construcción' },

  // Hierro
  hierro_6mm_12m: { precio: 8000, unidad: 'barra', fuente: 'Info Construcción' },
  hierro_8mm_12m: { precio: 11000, unidad: 'barra', fuente: 'Info Construcción' },
  hierro_10mm_12m: { precio: 18000, unidad: 'barra', fuente: 'Info Construcción' },

  // Hormigones
  hormigon_h21_m3: { precio: 55000, unidad: 'm3', fuente: 'Estimado' },
  hormigon_h25_m3: { precio: 65000, unidad: 'm3', fuente: 'Estimado' },

  // Maderas
  liston_ml: { precio: 800, unidad: 'ml', fuente: 'Hauster' },
  tirante_2x6_ml: { precio: 1200, unidad: 'ml', fuente: 'Hauster' },
  machimbre_m2: { precio: 3500, unidad: 'm2', fuente: 'Hauster' },
  deck_madera_m2: { precio: 15000, unidad: 'm2', fuente: 'Hauster' },

  // Steel Frame / Durlock
  durlock_plancha: { precio: 13000, unidad: 'plancha 1.2x2.4m', fuente: 'Info Construcción' },
  montante_ml: { precio: 2500, unidad: 'ml', fuente: 'Estimado' },

  // Pisos
  ceramico_m2: { precio: 3500, unidad: 'm2', fuente: 'Construnort' },
  porcelanato_m2: { precio: 6500, unidad: 'm2', fuente: 'Construnort' },
  gres_m2: { precio: 4500, unidad: 'm2', fuente: 'Construnort' },

  // Sanitarios
  inodoro: { precio: 65000, unidad: 'unidad', fuente: 'Jaque Mate' },
  bidet: { precio: 35000, unidad: 'unidad', fuente: 'Jaque Mate' },
  lavatorio: { precio: 45000, unidad: 'unidad', fuente: 'Jaque Mate' },
  griferia_bano: { precio: 25000, unidad: 'juego', fuente: 'Jaque Mate' },

  // Electricidad
  cable_100m: { precio: 1800, unidad: '100m', fuente: 'Easy' },
  tablero: { precio: 25000, unidad: 'unidad', fuente: 'Easy' },
  spot_led: { precio: 15000, unidad: 'unidad', fuente: 'Easy' },

  // Chapas
  chapa_acanalada: { precio: 15000, unidad: 'plancha', fuente: 'Easy' },
  chapa_trapezoidal: { precio: 18000, unidad: 'plancha', fuente: 'Easy' },

  // Pintura
  pintura_20l: { precio: 12000, unidad: '20l', fuente: 'Easy' },
  latex_20l: { precio: 15000, unidad: '20l', fuente: 'Easy' },

  // Aberturas
  ventana_aluminio_dvh: { precio: 85000, unidad: 'unidad', fuente: 'Easy' },
  puerta_entrada: { precio: 120000, unidad: 'unidad', fuente: 'Easy' },
};

// COSTO POR M² POR REGIÓN (2025-2026)
export const COSTO_M2_POR_REGION = {
  'gran_buenos_aires': {
    precio: 1620901,
    fuente: 'APYMECO Enero 2025',
    variacion_mensual: 1.34,
    variacion_interanual: 33.5,
  },
  'caba': {
    precio: 1700000, // Estimado actualizado
    fuente: 'IECyBA + ajuste',
    variacion_mensual: 2.9,
    variacion_interanual: 35,
  },
  'cordoba_capital': {
    precio: 1536935,
    fuente: 'CAPC Junio 2025',
    estructura: {
      tradicional: 1536935,
      steel_frame: 1658191,
    },
  },
  'la_plata': {
    precio: 1620901,
    fuente: 'APYMECO Enero 2025',
  },
  'rosario': {
    precio: 1550000, // Estimado
    fuente: 'Estimado basado en índice nacional',
  },
  'mendoza': {
    precio: 1500000, // Estimado
    fuente: 'Estimado basado en índice nacional',
  },
  'patagonia_norte': {
    precio: 1800000, // Estimado (mayor costo fletes)
    fuente: 'Estimado',
  },
  'patagonia_sur': {
    precio: 2100000, // Estimado (mayor costo fletes)
    fuente: 'Estimado',
  },
};

// FACTORES DE AJUSTE
export const FACTORES_AJUSTE = {
  // Por estructura
  estructura: {
    albanileria: 1.0,
    hormigon_armado: 1.3,
    steel_frame: 1.15,
    madera: 1.2,
    mixto: 1.1,
  },
  // Por categoría
  categoria: {
    economico: 0.75,
    estandar: 1.0,
    premium: 1.4,
    lujo: 2.0,
  },
  // Por zona
  zona: {
    capital_federal: 1.1,
    gran_buenos_aires: 1.0,
    cordoba_capital: 0.95,
    rosario: 0.96,
    neuquen: 1.1,
    patagonia: 1.25,
    interior_baja: 0.9,
  },
};

export function getFuentesPorTipo(tipo: FuenteInfo['tipo']): FuenteInfo[] {
  return FUENTES_WEB.filter(f => f.tipo === tipo);
}

export function getFuentesPreciosMateriales(): FuenteInfo[] {
  return getFuentesPorTipo('materiales');
}

export function getFuentesCostoM2(): FuenteInfo[] {
  return getFuentesPorTipo('precio_m2');
}
