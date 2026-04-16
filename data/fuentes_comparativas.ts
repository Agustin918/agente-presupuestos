export interface FuentePrecio {
  nombre: string;
  dominio: string;
  buscar: (material: string) => string;
  selectorPrecio: string;
  selectorTitulo?: string;
  enabled: boolean;
  requiresPlaywright?: boolean; // Si requiere navegación con Playwright para extraer precios
}

export const FUENTES_PRECIO: FuentePrecio[] = [
  {
    nombre: 'Easy',
    dominio: 'easy.com.ar',
    // URL de búsqueda que devuelve precios en JSON-LD
    buscar: (m) => `https://www.easy.com.ar/search?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price .price__current', // Selector CSS como fallback
    enabled: true,
  },
  {
    nombre: 'MercadoLibre',
    dominio: 'mercadolibre.com.ar',
    // URL de búsqueda directa
    buscar: (m) => `https://listado.mercadolibre.com.ar/${encodeURIComponent(m.replace(/\s+/g, '-'))}`,
    selectorPrecio: '.andes-money-amount__fraction',
    enabled: true,
    requiresPlaywright: true,
  },
  {
    nombre: 'La Pista 26',
    dominio: 'lapistay26.com.ar',
    // Página de búsqueda, requiere navegación a productos
    buscar: (m) => `https://www.lapistay26.com.ar/index.php?search=${encodeURIComponent(m)}&description=true`,
    selectorPrecio: '.price',
    enabled: false, // Deshabilitada por no mostrar precios accesibles
    requiresPlaywright: true,
  },
  {
    nombre: 'Construnort',
    dominio: 'construnort.com.ar',
    // URL de categoría específica (ladrillos) - funciona mejor que búsqueda
    buscar: (m) => {
      const categorias: Record<string, string> = {
        'ladrillo': 'ladrillos',
        'cemento': 'cementos',
        'arena': 'arena',
        'cal': 'cal',
        'hierro': 'hierro',
        'madera': 'maderas',
        'chapa': 'chapas',
        'ceramico': 'ceramicos',
        'porcelanato': 'porcelanatos',
        'pintura': 'pinturas',
      };
      for (const [key, cat] of Object.entries(categorias)) {
        if (m.toLowerCase().includes(key)) {
          return `https://www.construnort.com.ar/${cat}`;
        }
      }
      // Fallback a búsqueda genérica
      return `https://www.construnort.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`;
    },
    selectorPrecio: '.price',
    enabled: true,
  },
  {
    nombre: 'Hauster Maderera',
    dominio: 'hauster.com.ar',
    // WordPress WooCommerce, búsqueda no devuelve precios directamente
    buscar: (m) => `https://hauster.com.ar/?s=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: false, // Deshabilitada hasta encontrar método confiable
    requiresPlaywright: true,
  },
  {
    nombre: 'Jaque Mate',
    dominio: 'jaquemate.com.ar',
    // Búsqueda Magento, muestra precios en JSON-LD pero URL devuelve 404
    buscar: (m) => `https://www.jaquemate.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: false, // Deshabilitada por HTTP 404
    requiresPlaywright: true,
  },
  {
    nombre: 'Edificor',
    dominio: 'edificor.com.ar',
    // Similar a Easy/Construnort
    buscar: (m) => `https://www.edificor.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: false, // Deshabilitada por HTTP 404
    requiresPlaywright: true,
  },
];

export function getFuentesHabilitadas(): FuentePrecio[] {
  return FUENTES_PRECIO.filter(f => f.enabled);
}

export function getFuentePorNombre(nombre: string): FuentePrecio | undefined {
  return FUENTES_PRECIO.find(f => f.nombre.toLowerCase() === nombre.toLowerCase());
}

export const CATEGORIAS_PRECIO: Record<string, string[]> = {
  ladrillos: ['ladrillo', 'ladrillo hueco', 'ladrillo 12', 'ladrillo 18', 'bloque'],
  cemento: ['cemento', 'cemento portland', 'cemento alba', 'cemento holy', 'hormigón', 'hormigon', 'concreto', 'h21', 'h25'],
  arena: ['arena', 'arena gruesa', 'arena fina'],
  cal: ['cal', 'cal hidratada'],
  hierro: ['hierro', 'hierro 6mm', 'hierro 8mm', 'hierro 10mm', 'acero'],
  madera: ['madera', 'listón', 'tirante', 'machimbre', 'deck', 'puerta', 'placard', 'ropero', 'vestidor'],
  chapas: ['chapa', 'chapa galvanizada', 'chapa trapezoidal', 'chapa acanalada'],
  pisos: ['porcelanato', 'ceramico', 'piso ceramico', 'piso', 'gres'],
  sanitarios: ['inodoro', 'bidet', 'lavatorio', 'griferia', 'vanitory', 'bacinia', 'cocina', 'mueble cocina'],
  electricidad: ['cable', 'cable unipolar', 'toma', 'interruptor', 'techo', 'spot', 'aire acondicionado', 'split', 'climatizacion'],
  plomeria: ['caño', 'caño agua', 'caño desague', 'valvula', 'cano pvc'],
  gas: ['caño gas', 'caño煤气', 'regulador gas', 'calefacción', 'calefaccion', 'radiador', 'caldera'],
  pinturas: ['pintura', 'latex', 'esmalte', 'fijador', 'enduido', 'revoque', 'revoque fino', 'revoque grueso'],
  herrajes: ['tornillo', 'tornillo autoperforante', 'clavo', 'tarugo', 'aluminio', 'perfil aluminio', 'ventana aluminio', 'portón', 'porton', 'cerco', 'vidrio', 'cristal', 'vidrio dvh'],
  steel_frame: ['steel frame', 'montante', 'miel', 'durlock', 'yeso', 'cielorraso', 'cielorraso suspendido'],
  techo: ['membrana', 'aislante', 'lana vidrio', 'estructura cubierta', 'estructura de cubierta'],
  excavacion: ['excavacion', 'excavación', 'movimiento de suelos', 'movimiento suelos'],
};

export const CATEGORIA_A_FUENTES_PREFERIDAS: Record<string, string[]> = {
  ladrillos: ['Construnort', 'Easy', 'La Pista 26'],
  cemento: ['Construnort', 'Easy', 'La Pista 26'],
  arena: ['Construnort', 'Easy', 'La Pista 26'],
  cal: ['Construnort', 'Easy'],
  hierro: ['Construnort', 'Easy', 'La Pista 26'],
  madera: ['Hauster Maderera', 'Construnort', 'Easy'],
  chapas: ['Construnort', 'Easy', 'La Pista 26'],
  pisos: ['Easy', 'Construnort', 'La Pista 26'],
  sanitarios: ['Easy', 'La Pista 26', 'Construnort'],
  electricidad: ['Easy', 'La Pista 26', 'Construnort'],
  plomeria: ['Easy', 'La Pista 26', 'Construnort'],
  gas: ['Easy', 'La Pista 26', 'Construnort'],
  pinturas: ['Easy', 'Construnort', 'La Pista 26'],
  herrajes: ['La Pista 26', 'Easy', 'Construnort'],
  steel_frame: ['Construnort', 'Easy', 'La Pista 26'],
  techo: ['Construnort', 'Easy', 'La Pista 26'],
  excavacion: ['Easy', 'Construnort', 'La Pista 26'],
  otros: ['Easy', 'Construnort', 'La Pista 26', 'Hauster Maderera', 'Jaque Mate', 'Edificor'],
};

export function getFuentesPriorizadas(material: string): FuentePrecio[] {
  const categoria = getCategoriaMaterial(material);
  const fuentesPreferidas = CATEGORIA_A_FUENTES_PREFERIDAS[categoria] || CATEGORIA_A_FUENTES_PREFERIDAS.otros;
  const fuentesHabilitadas = getFuentesHabilitadas();
  
  // Ordenar: primero fuentes preferidas, luego el resto
  const fuentesOrdenadas: FuentePrecio[] = [];
  const fuentesNoPreferidas: FuentePrecio[] = [];
  
  for (const fuente of fuentesHabilitadas) {
    if (fuentesPreferidas.includes(fuente.nombre)) {
      fuentesOrdenadas.push(fuente);
    } else {
      fuentesNoPreferidas.push(fuente);
    }
  }
  
  // Ordenar fuentes preferidas según el orden en fuentesPreferidas
  fuentesOrdenadas.sort((a, b) => {
    const indexA = fuentesPreferidas.indexOf(a.nombre);
    const indexB = fuentesPreferidas.indexOf(b.nombre);
    return indexA - indexB;
  });
  
  // Agregar el resto al final
  return [...fuentesOrdenadas, ...fuentesNoPreferidas];
}

export function getCategoriaMaterial(material: string): string {
  const matLower = material.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIAS_PRECIO)) {
    if (keywords.some(kw => matLower.includes(kw))) {
      return cat;
    }
  }
  return 'otros';
}
