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

    for (const material of materiales) {
      // 1. Verificar Cache
      if (cache[material] && !this.estaVencido(cache[material].fecha)) {
        console.log(`[ResearchAgent] USANDO CACHE para: ${material}`);
        results[material] = {
          ...cache[material],
          material,
          razonamiento_agente: "Precio recuperado de memoria local (vigente)."
        };
        continue;
      }

      // 2. Investigación en la web (Multi-fase)
      try {
        const result = await this.investigarMaterial(material, ubicacion);
        if (result) {
          results[material] = result;
          cache[material] = result;
        }
      } catch (error) {
        console.error(`[ResearchAgent] Error investigando ${material}:`, error);
      }
    }

    this.guardarCache(cache);
    return results;
  }

  private async investigarMaterial(material: string, ubicacion: string): Promise<ResearchResult | null> {
    console.log(`[ResearchAgent] 🔍 DESCUBRIENDO: ${material}...`);
    
    // Fase 1: Descubrimiento de fuentes específicas (Corralones, Easy, Sodimac, MercadoLibre)
    const query = `precio "${material}" argentina ${ubicacion} sodimac easy mercadolibre corralon`;
    const discovery = await searchOnline(query);
    
    if (discovery.length === 0) return null;

    const candidatos: ResearchResult[] = [];

    // Fase 2: Navegación y Extracción (limitado a top 3 mejores fuentes para velocidad)
    for (const source of discovery.slice(0, 3)) {
      try {
        console.log(`[ResearchAgent] Navegando a: ${source.link}`);
        const { content } = await browserService.browse(source.link);
        const precio = extractPriceFromMarkdown(content, material);
        
        if (precio && precio > 0) {
          candidatos.push({
            material,
            precio,
            unidad: "ARS", // Casi siempre pesos en búsqueda local
            fuente: source.title,
            fuente_url: source.link,
            fecha: new Date().toISOString().split('T')[0],
            razonamiento_agente: `Extraído mediante navegación en ${new URL(source.link).hostname}`
          });
        }
      } catch (e) {
        console.warn(`[ResearchAgent] Falló extracción en ${source.link}`);
      }
    }

    if (candidatos.length === 0) return null;

    // Fase 3: Selección Inteligente (Selección ponderada por coherencia)
    candidatos.sort((a, b) => a.precio - b.precio);
    const seleccion = candidatos[Math.floor(candidatos.length / 2)]; // Median para evitar outliers
    
    return {
      ...seleccion,
      razonamiento_agente: `Seleccionado mediante análisis de ${candidatos.length} fuentes reales. Valor representativo del mercado local.`
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
}

export const researchAgent = new ResearchAgent();