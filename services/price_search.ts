import axios from 'axios';
import { SERPER_API_KEY } from '../config/settings';

interface PrecioEncontrado {
  material: string;
  precio: number;
  unidad: string;
  fuente: string;
  fuente_url: string;
  fecha: string;
}

export async function buscarPreciosEnVivo(
  materiales: string[],
  ubicacion: string = 'Argentina'
): Promise<Record<string, PrecioEncontrado>> {
  const resultados: Record<string, PrecioEncontrado> = {};
  
  if (!SERPER_API_KEY) {
    console.warn('[PriceSearch] No hay SERPER_API_KEY. Busqueda deshabilitada.');
    return resultados;
  }

  console.log(`[PriceSearch] Buscando precios para ${materiales.length} materiales...`);

  for (const material of materiales) {
    try {
      const precios = await buscarMaterial(material, ubicacion);
      if (precios.length > 0) {
        const precioElegido = precios[0];
        resultados[material] = precioElegido;
        console.log(`[PriceSearch] ✓ ${material}: $${precioElegido.precio.toLocaleString()} ${precioElegido.unidad}`);
      }
    } catch (error) {
      console.error(`[PriceSearch] ✗ Error: ${material}`);
    }
  }

  return resultados;
}

async function buscarMaterial(material: string, ubicacion: string): Promise<PrecioEncontrado[]> {
  const results: PrecioEncontrado[] = [];
  
  try {
    const response = await axios.post('https://google.serper.dev/search', {
      q: `${material} ${ubicacion} precio`,
      gl: 'ar',
      hl: 'es',
      num: 10,
    }, {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const organic = response.data.organic || [];
    
    for (const item of organic) {
      const snippet = item.snippet || item.title || '';
      const matches = buscarPreciosEnTexto(snippet);
      
      for (const precio of matches) {
        results.push({
          material,
          precio: precio.valor,
          unidad: precio.unidad,
          fuente: item.title?.substring(0, 50) || 'Web',
          fuente_url: item.link || '',
          fecha: new Date().toISOString().split('T')[0],
        });
      }
    }
    
  } catch (error) {
    console.error(`[PriceSearch] Error: ${material}`);
  }

  results.sort((a, b) => a.precio - b.precio);
  return results;
}

function buscarPreciosEnTexto(texto: string): { valor: number; unidad: string }[] {
  const results: { valor: number; unidad: string }[] = [];
  
  const patrones = [
    /\$?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:pesos?|ARS|\$|USD)/gi,
    /(\d{1,3}(?:\.\d{3})*,?\d{2})/g,
  ];

  for (const patron of patrones) {
    const matches = texto.matchAll(patron);
    for (const match of matches) {
      const precioStr = match[1].replace(/\./g, '').replace(',', '.');
      const precio = parseFloat(precioStr);
      
      if (precio > 100 && precio < 10000000) {
        let unidad = 'un';
        if (texto.includes('kg')) unidad = 'kg';
        else if (texto.includes('m2') || texto.includes('m²')) unidad = 'm2';
        else if (texto.includes('m3') || texto.includes('m³')) unidad = 'm3';
        else if (texto.includes('bolsa')) unidad = 'bolsa';
        
        results.push({ valor: precio, unidad });
      }
    }
  }

  return results;
}

export function convertirPreciosAFormato(
  precios: Record<string, PrecioEncontrado>
): Record<string, { precio: number; unidad: string; fuente_url: string; fecha: string }> {
  const resultado: Record<string, any> = {};
  
  for (const [material, data] of Object.entries(precios)) {
    const clave = material.toLowerCase()
      .replace(/(\d+mm)/g, '_$1')
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');
    
    resultado[clave] = {
      precio: data.precio,
      unidad: data.unidad,
      fuente_url: data.fuente_url,
      fecha: data.fecha,
    };
  }
  
  return resultado;
}