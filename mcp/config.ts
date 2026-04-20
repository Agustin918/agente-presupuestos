import { Blueprint, ObraHistorica, ExtractionResult } from "../blueprint/schema";
import { orchestrator, ResultadoOrquestador } from "../agents/orchestrator";
import { extractionAgent } from "../agents/extraction_agent";
import { researchAgent } from "../agents/research_agent";
import { synthesisAgent } from "../agents/synthesis_agent";
import { ingestaAgent, ResultadoIngesta } from "../agents/ingesta_agent";
import { MCPS } from "../config/settings";
import { getApifyTools, registerApifyMCPServer } from "./apify_server";
import { analyzeBlueprintWithApify, BlueprintAnalysisResult } from "../services/apify_blueprint";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: Function;
}

export const tools: MCPTool[] = [];

if (MCPS.playwright || true) {
  tools.push({
    name: "buscar_precio_material",
    description: "Devuelve el precio actualizado de materiales de construcción",
    inputSchema: {
      type: "object",
      properties: {
        materiales: { type: "array", items: { type: "string" } },
        ubicacion: { type: "string" },
      },
      required: ["materiales", "ubicacion"],
    },
    handler: async (params: { materiales: string[]; ubicacion: string }) => {
      return await researchAgent.getPrices(params.materiales, params.ubicacion);
    },
  });
}

if (MCPS.filesystem || true) {
  tools.push({
    name: "extraer_datos_archivo",
    description: "Lee un plano PDF, imagen 3D, SKP o DWG y extrae datos del proyecto",
    inputSchema: {
      type: "object",
      properties: {
        archivos: { type: "array", items: { type: "string" } },
      },
      required: ["archivos"],
    },
    handler: async (params: { archivos: string[] }): Promise<ExtractionResult> => {
      return await extractionAgent.extractFromFiles(params.archivos);
    },
  });
}

if (MCPS.memory || true) {
  if (MCPS.apify) {
    const apifyTools = getApifyTools();
    for (const apifyTool of apifyTools) {
      tools.push(apifyTool as any);
    }
  }

  tools.push({
    name: "generar_presupuesto",
    description: "Genera un presupuesto de construcción completo a partir de archivos y/o blueprint",
    inputSchema: {
      type: "object",
      properties: {
        archivos: { type: "array", items: { type: "string" } },
        blueprint: { type: "object" },
      },
      required: [],
    },
    handler: async (params: { archivos?: string[]; blueprint?: Blueprint }): Promise<ResultadoOrquestador> => {
      return await orchestrator.runWithFiles(params.archivos || [], params.blueprint || {});
    },
  });

  tools.push({
    name: "nueva_version_presupuesto",
    description: "Genera nueva versión de un presupuesto existente con cambios",
    inputSchema: {
      type: "object",
      properties: {
        blueprint_id: { type: "string" },
        cambios: { type: "object" },
        archivos: { type: "array", items: { type: "string" } },
      },
      required: ["blueprint_id", "cambios"],
    },
    handler: async (params: { blueprint_id: string; cambios: Partial<Blueprint>; archivos?: string[] }): Promise<ResultadoOrquestador> => {
      return await orchestrator.newVersion(params.blueprint_id, params.cambios, params.archivos);
    },
  });

  tools.push({
    name: "registrar_obra_cerrada",
    description: "Incorpora una obra finalizada a la base de conocimiento del estudio",
    inputSchema: {
      type: "object",
      properties: {
        obra: { type: "object" },
      },
      required: ["obra"],
    },
    handler: async (params: { obra: ObraHistorica }): Promise<ResultadoIngesta> => {
      await ingestaAgent.runSingle(params.obra);
      return { procesadas: 1, errores: 0, RubenNuevos: 0, ratiosAjustados: 0 };
    },
  });
}

export function getTools(): MCPTool[] {
  return tools;
}

export function registerAsMCPServer() {
  return {
    name: "presupuestos_construccion",
    version: "1.0.0",
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
}