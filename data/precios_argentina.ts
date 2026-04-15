// Precios de materiales actualizados para Argentina 2025
// Fuente: Info Construcción, CAMARCO, CAPBA

export const PRECIOS_MATERIALES_2025: Record<string, { precio: number; unidad: string; fuente: string }> = {
  // Cemento y Cal
  'cemento': { precio: 11500, unidad: 'bolsa 50kg', fuente: 'Info Construcción 2025' },
  'cemento portland': { precio: 11500, unidad: 'bolsa 50kg', fuente: 'Info Construcción 2025' },
  'cal': { precio: 8500, unidad: 'bolsa 30kg', fuente: 'Info Construcción 2025' },
  
  // Arena y Piedra
  'arena': { precio: 42000, unidad: 'm3', fuente: 'Info Construcción 2025' },
  'arena fina': { precio: 3000, unidad: 'bolsa 30kg', fuente: 'Info Construcción 2025' },
  'piedra partida': { precio: 100000, unidad: 'm3', fuente: 'Info Construcción 2025' },
  'tosca': { precio: 25000, unidad: 'm3', fuente: 'Estimado' },
  
  // Ladrillos
  'ladrillo comun': { precio: 220000, unidad: '1000 unidades', fuente: 'Info Construcción 2025' },
  'ladrillo': { precio: 220000, unidad: '1000 unidades', fuente: 'Info Construcción 2025' },
  'ladrillo hueco 12': { precio: 800, unidad: 'unidad', fuente: 'Info Construcción 2025' },
  'ladrillo hueco 18': { precio: 1400, unidad: 'unidad', fuente: 'Info Construcción 2025' },
  'ladrillo hueco portante': { precio: 1400, unidad: 'unidad', fuente: 'Info Construcción 2025' },
  'bloque cemento': { precio: 1386, unidad: 'unidad', fuente: 'Info Construcción 2025' },
  
  // Hierro
  'hierro 6mm': { precio: 8000, unidad: 'barra 12m', fuente: 'Info Construcción 2025' },
  'hierro 8mm': { precio: 11000, unidad: 'barra 12m', fuente: 'Info Construcción 2025' },
  'hierro 10mm': { precio: 18000, unidad: 'barra 12m', fuente: 'Info Construcción 2025' },
  'hierro 12mm': { precio: 26000, unidad: 'barra 12m', fuente: 'Info Construcción 2025' },
  'acero': { precio: 12000, unidad: 'kg', fuente: 'Estimado' },
  
  // Hormigón
  'hormigon h21': { precio: 45000, unidad: 'm3', fuente: 'Estimado' },
  'hormigon h25': { precio: 55000, unidad: 'm3', fuente: 'Estimado' },
  
  // Chapas
  'chapa acanalada': { precio: 15000, unidad: 'plancha', fuente: 'Estimado' },
  'chapa trapezoidal': { precio: 18000, unidad: 'plancha', fuente: 'Estimado' },
  'chapa galvanizada': { precio: 16000, unidad: 'plancha', fuente: 'Estimado' },
  
  // Maderas
  'liston': { precio: 800, unidad: 'ml', fuente: 'Hauster' },
  'tirante 2x6': { precio: 1200, unidad: 'ml', fuente: 'Hauster' },
  'tirante 3x6': { precio: 1800, unidad: 'ml', fuente: 'Hauster' },
  'machimbre': { precio: 3500, unidad: 'm2', fuente: 'Hauster' },
  'deck madera': { precio: 15000, unidad: 'm2', fuente: 'Hauster' },
  
  // Durlock / Steel Frame
  'durlock': { precio: 13000, unidad: 'plancha 1.2x2.4m', fuente: 'Info Construcción 2025' },
  'placa yeso': { precio: 13000, unidad: 'plancha 1.2x2.4m', fuente: 'Info Construcción 2025' },
  'montante steel': { precio: 2500, unidad: 'ml', fuente: 'Estimado' },
  'steel frame': { precio: 8500, unidad: 'm2', fuente: 'CAPC 2025' },
  
  // Pisos
  'ceramico': { precio: 3500, unidad: 'm2', fuente: 'Construnort' },
  'porcelanato': { precio: 6500, unidad: 'm2', fuente: 'Construnort' },
  'gres': { precio: 4500, unidad: 'm2', fuente: 'Construnort' },
  'pisos': { precio: 4000, unidad: 'm2', fuente: 'Estimado' },
  
  // Sanitarios
  'inodoro': { precio: 65000, unidad: 'unidad', fuente: 'Jaque Mate' },
  'bidet': { precio: 35000, unidad: 'unidad', fuente: 'Jaque Mate' },
  'lavatorio': { precio: 45000, unidad: 'unidad', fuente: 'Jaque Mate' },
  'vanitory': { precio: 55000, unidad: 'unidad', fuente: 'Jaque Mate' },
  'griferia': { precio: 25000, unidad: 'juego', fuente: 'Jaque Mate' },
  
  // Electricidad
  'cable': { precio: 1800, unidad: '100m', fuente: 'Easy' },
  'cable unipolar': { precio: 2000, unidad: '100m', fuente: 'Easy' },
  'techo': { precio: 15000, unidad: 'unidad', fuente: 'Easy' },
  'tablero': { precio: 25000, unidad: 'unidad', fuente: 'Easy' },
  'interruptor': { precio: 2500, unidad: 'unidad', fuente: 'Easy' },
  
  // Plomería
  'cano pvc': { precio: 2500, unidad: '3m', fuente: 'Easy' },
  'cano agua': { precio: 3000, unidad: '3m', fuente: 'Easy' },
  'valvula': { precio: 5000, unidad: 'unidad', fuente: 'Easy' },
  
  // Gas
  'cano gas': { precio: 4500, unidad: '3m', fuente: 'Easy' },
  'regulador gas': { precio: 15000, unidad: 'unidad', fuente: 'Easy' },
  
  // Pintura
  'pintura': { precio: 12000, unidad: '20l', fuente: 'Easy' },
  'latex': { precio: 15000, unidad: '20l', fuente: 'Easy' },
  'fijador': { precio: 8000, unidad: '20l', fuente: 'Easy' },
  'enduido': { precio: 6000, unidad: '25kg', fuente: 'Easy' },
  
  // Techo
  'membrana': { precio: 8000, unidad: 'm2', fuente: 'Easy' },
  'lana vidrio': { precio: 4500, unidad: 'm2', fuente: 'Easy' },
  'ruberoid': { precio: 3500, unidad: 'm2', fuente: 'Estimado' },
  
  // Aberturas
  'ventana aluminio': { precio: 85000, unidad: 'unidad', fuente: 'Easy' },
  'puerta madera': { precio: 65000, unidad: 'unidad', fuente: 'Estimado' },
  
  // Varios
  'tornillo': { precio: 25, unidad: 'unidad', fuente: 'Easy' },
  'clavo': { precio: 800, unidad: 'kg', fuente: 'Easy' },
};

export const COSTO_POR_M2_2025 = {
  'bsas': { precio: 1620901, unidad: 'm2', fuente: 'APYMECO Enero 2025' },
  'cba_tradicional': { precio: 1536935, unidad: 'm2', fuente: 'CAPC Junio 2025' },
  'cba_steelframe': { precio: 1658191, unidad: 'm2', fuente: 'CAPC Junio 2025' },
};

export function getPrecioMaterial(material: string): { precio: number; unidad: string; fuente: string } | null {
  const lower = material.toLowerCase();
  
  // Búsqueda exacta
  if (PRECIOS_MATERIALES_2025[lower]) {
    return PRECIOS_MATERIALES_2025[lower];
  }
  
  // Búsqueda parcial
  for (const [key, value] of Object.entries(PRECIOS_MATERIALES_2025)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  
  return null;
}

export function getCostoM2(ubicacion: string): { precio: number; unidad: string; fuente: string } {
  const lower = ubicacion.toLowerCase();
  
  if (lower.includes('cordoba')) {
    return COSTO_POR_M2_2025.cba_tradicional;
  }
  if (lower.includes('bsas') || lower.includes('buenos aires') || lower.includes('la plata')) {
    return COSTO_POR_M2_2025.bsas;
  }
  
  // Default: promedio
  return {
    precio: Math.round((COSTO_POR_M2_2025.bsas.precio + COSTO_POR_M2_2025.cba_tradicional.precio) / 2),
    unidad: 'm2',
    fuente: 'Promedio CAPBA/APYMECO 2025'
  };
}
