import { Blueprint, ItemPresupuesto } from '../blueprint/schema';

// Materiales essentials para construcción - búsqueda online
const MATERIALES_BASE = [
  'ladrillo hueco 18x18x33',
  'cemento portland 50kg',
  'arena gruesa m3',
  'hierro 8mm construccion',
  'hierro 10mm construccion',
  'hormigon elaborado m3',
  'chapa trapezoidal zinc',
  'perfil metalico omega',
  'porcelanato 60x60',
  'ceramico 30x30',
  'aluminio ventana dvh',
  'vidrio float 4mm',
  'cable electrico 2.5mm',
  'caño gas epoxi',
  'caño agua pp',
  'pintura latex 20l',
  'placa durlock',
  'perfil durlock',
];

// Mapeo de materiales a claves internas
const MAPA_CLAVES: Record<string, string> = {
  'ladrillo hueco': 'ladrillo',
  'cemento portland': 'cemento',
  'arena': 'arena',
  'hierro 8mm': 'hierro_8',
  'hierro 10mm': 'hierro_10',
  'hormigon': 'hormigon',
  'chapa': 'chapa',
  'perfil metalico': 'perfil',
  'porcelanato': 'porcelanato',
  'ceramico': 'ceramico',
  'aluminio': 'aluminio',
  'vidrio': 'vidrio',
  'cable': 'electrica',
  'caño gas': 'gas',
  'caño agua': 'sanitaria',
  'pintura': 'pintura',
  'placa durlock': 'cielorraso',
  'perfil durlock': 'estructura_cubierta',
};

export function getMaterialesRequeridos(blueprint: Blueprint): string[] {
  const materiales = [...MATERIALES_BASE];
  
  // Agregar según terminaciones
  if (blueprint.pisos === 'porcelanato') {
    materiales.push('porcelanato 60x60');
  } else if (blueprint.pisos === 'ceramico') {
    materiales.push('ceramico 30x30');
  }
  
  // Agregar según aberturas
  if (blueprint.aberturas?.includes('aluminio')) {
    materiales.push('aluminio ventana dvh');
    materiales.push('vidrio float 4mm');
  }
  
  // Agregar instalaciones
  if (blueprint.instalaciones?.includes('electrica')) {
    materiales.push('cable electrico 2.5mm');
  }
  if (blueprint.instalaciones?.includes('gas')) {
    materiales.push('caño gas epoxi');
  }
  if (blueprint.instalaciones?.includes('sanitaria')) {
    materiales.push('caño agua pp');
  }
  
  return [...new Set(materiales)];
}

export function mapearPrecio(material: string, precioARS: number, unidad: string, fuente: string): { clave: string; precio: number; unidad: string; fuente_url: string } {
  // Normalizar material a clave
  let clave = '';
  for (const [k, v] of Object.entries(MAPA_CLAVES)) {
    if (material.toLowerCase().includes(k)) {
      clave = v;
      break;
    }
  }
  if (!clave) clave = material.substring(0, 20).replace(/\s+/g, '_');
  
  return {
    clave,
    precio: precioARS,
    unidad,
    fuente_url: fuente,
  };
}