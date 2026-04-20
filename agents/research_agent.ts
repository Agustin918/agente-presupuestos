import { browserService } from "../services/browser_service";
import { searchOnline } from "../services/search_service";
import { extractPriceFromMarkdown } from "./scraper";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import * as fs from "fs";
import * as path from "path";

const CACHE_PATH = "./data/cache/precios.json";

export interface ResearchResult {
  material: string;
  precio: number;
  unidad: string;
  fuente: string;
  fuente_url: string;
  fecha: string;
  razonamiento_agente: string;
}

export class ResearchAgent {
  async getPrices(materiales: string[], ubicacion: string): Promise<Record<string, ResearchResult>> {
    const results: Record<string, ResearchResult> = {};
    const cache = this.leerCache();

    console.log(`[ResearchAgent] Iniciando investigación técnica para ${materiales.length} materiales en ${ubicacion}`);
    console.log(`[ResearchAgent] MODO: siempre buscar en internet (sin cache)`);

    for (const material of materiales) {
      // SIEMPRE buscar en internet - el cache solo como último recurso si falla la búsqueda
      let precioEncontrado = false;
      
      try {
        console.log(`[ResearchAgent] 🔍 BUSCANDO en internet: ${material}`);
        const result = await this.investigarMaterial(material, ubicacion);
        if (result) {
          results[material] = result;
          cache[material] = result;
          precioEncontrado = true;
        }
      } catch (error) {
        console.error(`[ResearchAgent] Error en ${material}:`, error);
      }

      // Solo si NO se encontró en internet, usar cache como fallback
      if (!precioEncontrado && cache[material]) {
        console.log(`[ResearchAgent] FALLBACK CACHE para: ${material}`);
        results[material] = {
          ...cache[material],
          material,
          razonamiento_agente: "⚠️ Precio del cache (búsqueda falló)"
        };
      }
      
      // Último fallback: precios paramétricos en USD
      if (!precioEncontrado && !cache[material]) {
        console.log(`[ResearchAgent] FALLBACK PARAMÉTRICO para: ${material}`);
        results[material] = this.getPrecioParametrico(material);
      }
    }

    this.guardarCache(cache);
    return results;
  }

private async investigarMaterial(material: string, ubicacion: string): Promise<ResearchResult | null> {
    console.log(`[ResearchAgent] 🔍 DESCUBRIENDO: ${material}...`);
    
    // Usar URLs de fuentes confiables directamente
    const urls = this.getFuentesConfiables(material);
    const candidatos: ResearchResult[] = [];

    // Navegar directamente a las URLs de corralones y casas de materiales
    for (const url of urls.slice(0, 2)) {
      try {
        console.log(`[ResearchAgent] Navegando a: ${url}`);
        const { content } = await browserService.browse(url);
        const precio = extractPriceFromMarkdown(content, material);
        
        if (precio && precio > 0) {
          candidatos.push({
            material,
            precio,
            unidad: "ARS",
            fuente: new URL(url).hostname,
            fuente_url: url,
            fecha: new Date().toISOString().split('T')[0],
            razonamiento_agente: `Extraído de ${new URL(url).hostname}`
          });
        }
      } catch (e) {
        console.warn(`[ResearchAgent] Falló: ${url}`);
      }
    }

    if (candidatos.length === 0) return null;

    // Seleccionar precio medio (evita outliers)
    candidatos.sort((a, b) => a.precio - b.precio);
    const seleccion = candidatos[Math.floor(candidatos.length / 2)];
    
    return {
      ...seleccion,
      razonamiento_agente: `Seleccionado de ${candidatos.length} fuentes reales`
    };
  }

  private leerCache(): Record<string, any> {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    }
    return {};
  }

  private guardarCache(cache: Record<string, any>): void {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }

  private estaVencido(fecha: string): boolean {
    const hoy = new Date();
    const f = new Date(fecha);
    const diff = Math.floor((hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
    return diff > PRECIO_VIGENCIA_DIAS;
  }

  // Fuentes confiables por categoría de material
  private getFuentesConfiables(material: string): string[] {
    const m = encodeURIComponent(material.replace(/ /g, '+'));
    
    return [
      `https://listado.mercadolibre.com.ar/${m}`,
      `https://www.easy.com.ar/s/${m}`,
      `https://www.sodimac.com.ar/s/${m}`,
    ];
  }

  // Fallback: Precios paramétricos en USD basados en mercado argentino
  private getPrecioParametrico(material: string): ResearchResult {
    const precios: Record<string, number> = {
      limpiador: 2,
      replanteo: 3,
      cartel: 80,
      excavacion: 15,
      relleno: 12,
      hormigon_fundacion: 65,
      viga_fundacion: 55,
      columna: 45,
      encadenado: 25,
      ladrillo: 12,
      ladrillo_12: 8,
      hidrofugo: 8,
      aislante: 10,
      estructura_cubierta: 30,
      cubierta: 18,
      revoque_grueso: 12,
      revoque_fino: 10,
      cielorraso: 15,
      contrapiso: 20,
      piso: 28,
      zocalo: 5,
      electrica: 35,
      sanitaria: 45,
      desague: 12,
      gas: 30,
      aire: 280,
      inodoro: 150,
      ducha: 220,
      lavatorio: 120,
      griferia_cocina: 85,
      puerta_interior: 120,
      ventana: 180,
      vidrio: 22,
      placard: 200,
      pintura: 8,
      pintura_exterior: 10,
      limpieza_final: 5,
      ayuda_gremio: 1500,
    };

    const key = material.toLowerCase().replace(/ /g, '_');
    const precio = precios[key] || 10;

    return {
      material,
      precio,
      unidad: 'USD',
      fuente: 'Base paramétrica estudios',
      fuente_url: '',
      fecha: new Date().toISOString().split('T')[0],
      razonamiento_agente: '⚠️ Precio paramétrico USD (web no disponible)'
    };
  }
}

export const researchAgent = new ResearchAgent();