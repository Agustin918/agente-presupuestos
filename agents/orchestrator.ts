import { Blueprint, Presupuesto, PresupuestoComparativo, ExtractionResult } from "../blueprint/schema";
import { validarBlueprint } from "../blueprint/validator";
import { extractionAgent } from "./extraction_agent";
import { researchAgent } from "./research_agent";
import { synthesisAgent } from "./synthesis_agent";
import { ingestaAgent } from "./ingesta_agent";
import { crearNuevaVersion } from "../blueprint/versioning";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import * as fs from "fs";
import * as path from "path";

export interface LogEntry {
  timestamp: string;
  agente: string;
  accion: string;
  resultado: string;
  duracion_ms?: number;
  error?: string;
}

export interface ResultadoOrquestador {
  exito: boolean;
  presupuesto?: Presupuesto;
  comparativo?: PresupuestoComparativo;
  extraction?: ExtractionResult;
  version?: number;
  errores: string[];
  logs: LogEntry[];
}

const OUTPUT_DIR = "./output";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(agente: string, accion: string, resultado: string, duracion?: number, error?: string): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    agente,
    accion,
    resultado,
    duracion_ms: duracion,
    error,
  };
}

async function runExtraction(files: string[]): Promise<ExtractionResult> {
  const start = Date.now();
  try {
    const result = await extractionAgent.extractFromFiles(files);
    const duracion = Date.now() - start;
    console.log(`[Orchestrator] Extraction: ${Object.keys(result.blueprint_parcial).length} campos extraídos`);
    return result;
  } catch (error: any) {
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

async function runResearch(blueprint: Blueprint): Promise<Record<string, any>> {
  const start = Date.now();
  try {
    const materiales = getMaterialesDelBlueprint(blueprint);
    const precios = await researchAgent.getPrices(materiales, blueprint.ubicacion);
    const duracion = Date.now() - start;
    console.log(`[Orchestrator] Research: ${Object.keys(precios).length} precios obtenidos`);
    return precios;
  } catch (error: any) {
    throw new Error(`Research failed: ${error.message}`);
  }
}

async function runSynthesis(blueprint: Blueprint, precios: Record<string, any>, confianzaExtraccion?: Record<string, any>): Promise<Presupuesto> {
  const start = Date.now();
  try {
    const presupuesto = await synthesisAgent.generarPresupuesto(blueprint, precios, confianzaExtraccion);
    const duracion = Date.now() - start;
    console.log(`[Orchestrator] Synthesis: presupuesto generado total ${presupuesto.total_estimado}`);
    return presupuesto;
  } catch (error: any) {
    throw new Error(`Synthesis failed: ${error.message}`);
  }
}

function getMaterialesDelBlueprint(blueprint: Blueprint): string[] {
  const materiales: string[] = [];

  if (blueprint.estructura === "steel_frame") {
    materiales.push("steel frame", "panel durlock", "tornillos");
  } else if (blueprint.estructura === "hormigon_armado") {
    materiales.push("hormigon", "hierro 8mm", "hierro 6mm", "cemento");
  } else if (blueprint.estructura === "albanileria") {
    materiales.push("ladrillo", "cemento", "arena");
  }

  if (blueprint.cubierta.includes("chapa")) {
    materiales.push("chapa", "tornillo autoperforante");
  }

  if (blueprint.pisos === "porcelanato") {
    materiales.push("porcelanato", "pegamento");
  } else if (blueprint.pisos === "ceramico") {
    materiales.push("ceramico", "pegamento");
  }

  if (blueprint.aberturas.includes("aluminio")) {
    materiales.push("ventana aluminio");
  } else if (blueprint.aberturas === "pvc") {
    materiales.push("ventana pvc");
  }

  if (blueprint.instalaciones.includes("electrica")) {
    materiales.push("cable", "techa", "tablero");
  }
  if (blueprint.instalaciones.includes("sanitaria")) {
    materiales.push("caño pvp", "grifería");
  }
  if (blueprint.instalaciones.includes("gas")) {
    materiales.push("caño gas", "regulador");
  }
  if (blueprint.instalaciones.includes("paneles_solares")) {
    materiales.push("panel solar", "inversor");
  }

  return materiales;
}

export async function runWithFiles(
  files: string[],
  blueprintParcial?: Partial<Blueprint>
): Promise<ResultadoOrquestador> {
  const logs: LogEntry[] = [];
  const errores: string[] = [];
  const start = Date.now();

  let extractionResult: ExtractionResult | undefined;

  if (files.length > 0) {
    const extractionStart = Date.now();
    try {
      extractionResult = await runExtraction(files);
      logs.push(log("extraction_agent", "extractFromFiles", "ok", Date.now() - extractionStart));
    } catch (error: any) {
      logs.push(log("extraction_agent", "extractFromFiles", "error", Date.now() - extractionStart, error.message));
      errores.push(`Extraction error: ${error.message}`);
    }
  }

  const mergedBlueprint = {
    ...extractionResult?.blueprint_parcial,
    ...blueprintParcial,
  };

  const validationStart = Date.now();
  const validacion = validarBlueprint(mergedBlueprint);
  if (!validacion.valido) {
    logs.push(log("orchestrator", "validar", "error", Date.now() - validationStart, validacion.errores.join("; ")));
    return {
      exito: false,
      errores: validacion.errores,
      logs,
    };
  }
  logs.push(log("orchestrator", "validar", "ok", Date.now() - validationStart));

  const blueprint = validacion.blueprint!;

  const researchStart = Date.now();
  let precios: Record<string, any> = {};
  try {
    precios = await runResearch(blueprint);
    logs.push(log("research_agent", "getPrices", "ok", Date.now() - researchStart));
  } catch (error: any) {
    logs.push(log("research_agent", "getPrices", "error", Date.now() - researchStart, error.message));
    errores.push(`Research error: ${error.message}`);
  }

  const synthesisStart = Date.now();
  let presupuesto: Presupuesto | undefined;
  let comparativo: PresupuestoComparativo | undefined;

  try {
    presupuesto = await runSynthesis(blueprint, precios, extractionResult?.confianza);
    logs.push(log("synthesis_agent", "generarPresupuesto", "ok", Date.now() - synthesisStart));

    if (blueprint.escenarios) {
      const compStart = Date.now();
      comparativo = await synthesisAgent.generarPresupuestoComparativo(blueprint);
      logs.push(log("synthesis_agent", "generarPresupuestoComparativo", "ok", Date.now() - compStart));
    }
  } catch (error: any) {
    logs.push(log("synthesis_agent", "generarPresupuesto", "error", Date.now() - synthesisStart, error.message));
    errores.push(`Synthesis error: ${error.message}`);
  }

  if (errores.length > 0 || !presupuesto) {
    return {
      exito: false,
      errores,
      logs,
    };
  }

  ensureDir(OUTPUT_DIR);
  const usuarioDir = path.join(OUTPUT_DIR, blueprint.usuario_id);
  ensureDir(usuarioDir);

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const outputFile = path.join(usuarioDir, `${blueprint.id}_v${blueprint.version}_${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({ presupuesto, comparativo, extractionResult }, null, 2));
  logs.push(log("orchestrator", "save", "ok", 0, `Guardado en ${outputFile}`));

  return {
    exito: true,
    presupuesto,
    comparativo,
    extraction: extractionResult,
    version: blueprint.version,
    errores: [],
    logs,
  };
}

export async function newVersion(
  blueprintId: string,
  cambios: Partial<Blueprint>,
  files?: string[]
): Promise<ResultadoOrquestador> {
  // Implementación simplificada: en un sistema real buscaríamos el blueprint anterior
  // y generaríamos nueva versión con diff
  console.log(`[Orchestrator] Nueva versión para ${blueprintId}`);
  
  const resultado = await runWithFiles(files || [], cambios);
  
  if (resultado.exito && resultado.presupuesto) {
    // Aquí se agregaría lógica de versionado comparando con el anterior
    console.log(`[Orchestrator] Versión ${resultado.version} creada`);
  }
  
  return resultado;
}

export const orchestrator = {
  runWithFiles,
  newVersion,
};