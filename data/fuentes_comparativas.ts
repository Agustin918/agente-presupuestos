export interface FuentePrecio {
  nombre: string;
  dominio: string;
  buscar: (material: string) => string;
  selectorPrecio: string;
  selectorTitulo?: string;
  enabled: boolean;
}

export const FUENTES_PRECIO: FuentePrecio[] = [
  {
    nombre: 'Easy',
    dominio: 'easy.com.ar',
    buscar: (m) => `https://www.easy.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price .price__current',
    enabled: true,
  },
  {
    nombre: 'La Pista 26',
    dominio: 'lapistay26.com.ar',
    buscar: (m) => `https://www.lapistay26.com.ar/index.php?search=${encodeURIComponent(m)}&description=true`,
    selectorPrecio: '.price',
    enabled: true,
  },
  {
    nombre: 'Construnort',
    dominio: 'construnort.com.ar',
    buscar: (m) => `https://www.construnort.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: true,
  },
  {
    nombre: 'Hauster Maderera',
    dominio: 'hauster.com.ar',
    buscar: (m) => `https://hauster.com.ar/?s=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: true,
  },
  {
    nombre: 'Jaque Mate',
    dominio: 'jaquemate.com.ar',
    buscar: (m) => `https://www.jaquemate.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: true,
  },
  {
    nombre: 'Edificor',
    dominio: 'edificor.com.ar',
    buscar: (m) => `https://www.edificor.com.ar/catalogsearch/result/?q=${encodeURIComponent(m)}`,
    selectorPrecio: '.price',
    enabled: true,
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
  cemento: ['cemento', 'cemento portland', 'cemento alba', 'cemento holy'],
  arena: ['arena', 'arena gruesa', 'arena fina'],
  cal: ['cal', 'cal hidratada'],
  hierro: ['hierro', 'hierro 6mm', 'hierro 8mm', 'hierro 10mm', 'acero'],
  madera: ['madera', 'listón', 'tirante', 'machimbre', 'deck'],
  chapas: ['chapa', 'chapa galvanizada', 'chapa trapezoidal', 'chapa acanalada'],
  pisos: ['porcelanato', 'ceramico', 'piso ceramico', 'piso', 'gres'],
  sanitarios: ['inodoro', 'bidet', 'lavatorio', 'griferia', 'vanitory', 'bacinia'],
  electricidad: ['cable', 'cable unipolar', 'toma', 'interruptor', 'techo', 'spot'],
  plomeria: ['caño', 'caño agua', 'caño desague', 'valvula', 'cano pvc'],
  gas: ['caño gas', 'caño煤气', 'regulador gas'],
  pinturas: ['pintura', 'latex', 'esmalte', 'fijador', 'enduido'],
  herrajes: ['tornillo', 'tornillo autoperforante', 'clavo', 'tarugo'],
  steel_frame: ['steel frame', 'montante', 'miel', 'durlock', 'yeso'],
  techo: ['membrana', 'aislante', 'lana vidrio'],
};
