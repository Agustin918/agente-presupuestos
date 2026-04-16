import { Blueprint, Presupuesto, PresupuestoComparativo, ExtractionResult } from "../blueprint/schema";
import { validarBlueprint } from "../blueprint/validator";
import { extractionAgent } from "./extraction_agent";
import { researchAgent } from "./research_agent";
import { synthesisAgent } from "./synthesis_agent";
import { ingestaAgent } from "./ingesta_agent";
import { QAAgent } from "./qa_agent";
import { crearNuevaVersion } from "../blueprint/versioning";
import { PRECIO_VIGENCIA_DIAS, TASA_CAMBIO_USD as DEFAULT_TASA } from "../config/settings";
import { fetchLiveExchangeRate } from "../utils/currency";
import * as fs from "fs";
import * as path from "path";
import { getDb } from "../database/db";
import { driveService } from "../services/google_drive";
import { excelGenerator } from "../output/excel_generator";
import { pdfGenerator } from "../output/pdf_generator";
import { googleSheetsService } from "../services/google_sheets_service";

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
    // Obtener tasa de cambio en vivo si es posible
    const tasaLive = await fetchLiveExchangeRate();
    
    const presupuesto = await synthesisAgent.generarPresupuesto(blueprint, precios, confianzaExtraccion, tasaLive);
    const duracion = Date.now() - start;
    
    const val = presupuesto.validacion_tecnica;
    console.log(`[Orchestrator] Synthesis: ${presupuesto.total_estimado} USD (Validación: ${val?.resultado.toUpperCase()})`);
    
    return presupuesto;
  } catch (error: any) {
    throw new Error(`Synthesis failed: ${error.message}`);
  }
}

export function getMaterialesDelBlueprint(blueprint: Blueprint): string[] {
  const materiales: string[] = [];

  // Estructura
  if (blueprint.estructura === "steel_frame") {
    materiales.push("steel frame", "panel durlock", "tornillos");
  } else if (blueprint.estructura === "hormigon_armado") {
    materiales.push("hormigon", "hierro 8mm", "hierro 6mm", "cemento", "arena", "acero");
  } else if (blueprint.estructura === "albanileria") {
    materiales.push("ladrillo", "cemento", "arena", "bloque");
  }

  // Excavación y movimiento de suelos
  if (blueprint.terreno.desnivel_metros && blueprint.terreno.desnivel_metros > 0) {
    materiales.push("excavacion", "movimiento de suelos");
  }

  // Cubierta
  if (blueprint.cubierta.includes("chapa")) {
    materiales.push("chapa trapezoidal", "chapa acanalada", "tornillo autoperforante");
  } else if (blueprint.cubierta.includes("teja")) {
    materiales.push("teja ceramica", "teja cementicia");
  }
  materiales.push("estructura cubierta", "perfil metalico");

  // Pisos
  if (blueprint.pisos === "porcelanato") {
    materiales.push("porcelanato", "pegamento porcelanato");
  } else if (blueprint.pisos === "ceramico") {
    materiales.push("ceramico", "pegamento ceramico");
  } else if (blueprint.pisos === "madera") {
    materiales.push("piso madera", "entablonado");
  } else if (blueprint.pisos === "microcemento") {
    materiales.push("microcemento", "sellador");
  }

  // Aberturas y vidrios
  if (blueprint.aberturas.includes("aluminio")) {
    materiales.push("ventana aluminio", "perfil aluminio", "vidrio dvh", "cristal");
  } else if (blueprint.aberturas === "pvc") {
    materiales.push("ventana pvc", "vidrio dvh");
  } else if (blueprint.aberturas === "madera") {
    materiales.push("ventana madera", "vidrio");
  }

  // Revestimientos y pintura
  materiales.push("revoque fino", "revoque grueso", "pintura latex", "pintura esmalte");

  // Cielorraso
  if (blueprint.cielorraso === "suspendido") {
    materiales.push("cielorraso suspendido", "durlock", "yeso");
  }

  // Carpintería interior
  materiales.push("puerta interior", "placard", "ropero", "mueble cocina");

  // Instalaciones
  if (blueprint.instalaciones.includes("electrica")) {
    materiales.push("cable electrico", "tablero electrico", "llave termica", "spot led");
  }
  if (blueprint.instalaciones.includes("sanitaria")) {
    materiales.push("caño pvc", "caño cloaca", "griferia", "inodoro", "bidet", "ducha");
  }
  if (blueprint.instalaciones.includes("gas")) {
    materiales.push("caño gas", "regulador gas", "llave gas");
  }
  if (blueprint.instalaciones.includes("aire_acondicionado")) {
    materiales.push("aire acondicionado split", "climatizacion", "split inverter");
  }
  if (blueprint.instalaciones.includes("calefaccion_radiante")) {
    materiales.push("calefaccion radiante", "radiador", "caldera");
  }
  if (blueprint.instalaciones.includes("paneles_solares")) {
    materiales.push("panel solar", "inversor solar");
  }
  if (blueprint.instalaciones.includes("domotica")) {
    materiales.push("domotica", "sensor", "central domotica");
  }

  // Sanitarios y grifería
  materiales.push("sanitario", "griferia cocina", "griferia baño");

  // Calentador de agua
  if (blueprint.calentador_agua === "termotanque_gas") {
    materiales.push("termotanque gas");
  } else if (blueprint.calentador_agua === "termotanque_electrico") {
    materiales.push("termotanque electrico");
  }

  // Equipamiento
  if (blueprint.cocina_equipada) {
    materiales.push("cocina equipada", "mesada", "bajo mesada");
  }
  materiales.push("vanitory", "mueble baño");

  // Exteriores
  if (blueprint.porton_cerco) {
    materiales.push("porton metalico", "cerco metalico");
  }
  if (blueprint.tiene_deck) {
    materiales.push("deck madera", "entablonado exterior");
  }
  if (blueprint.tiene_galeria) {
    materiales.push("galeria", "columnas galeria");
  }
  if (blueprint.tiene_quincho) {
    materiales.push("quincho", "parrilla");
  }

  // Varios
  materiales.push("aislante termico", "membrana", "hidrofugo");

  // Eliminar duplicados y devolver
  return [...new Set(materiales)];
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
    especificaciones_tecnicas: extractionResult?.especificaciones_tecnicas
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

    // --- AGENTE AUDITOR (QA) ---
    const qaStart = Date.now();
    try {
      const qaReport = await QAAgent.revisarPresupuesto(blueprint, presupuesto);
      presupuesto.reporte_qa = qaReport;
      logs.push(log("qa_agent", "revisarPresupuesto", qaReport.status, Date.now() - qaStart));
      console.log(`[Orchestrator] Auditoría QA terminada: ${qaReport.status.toUpperCase()}`);
    } catch (qaErr: any) {
      console.warn(`[Orchestrator] Error en Auditoría QA: ${qaErr.message}`);
    }

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

  // --- PERSISTENCIA EN BASE DE DATOS ---
  try {
    const db = await getDb();
    
    // 1. Guardar/Actualizar Proyecto
    await db.run(`
      INSERT INTO proyectos (id, nombre_obra, ubicacion, usuario_id, estudio_id, fecha_creacion, blueprint_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nombre_obra = excluded.nombre_obra,
        blueprint_json = excluded.blueprint_json
    `, [
      blueprint.id,
      blueprint.nombre_obra,
      blueprint.ubicacion,
      blueprint.usuario_id,
      blueprint.estudio_id,
      new Date().toISOString(),
      JSON.stringify(blueprint)
    ]);

    // 2. Guardar Versión de Presupuesto
    await db.run(`
      INSERT INTO presupuestos (id, proyecto_id, version, fecha, total_estimado, costo_m2, divisa, datos_json, validacion_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `${blueprint.id}_v${blueprint.version}`,
      blueprint.id,
      blueprint.version,
      presupuesto.fecha,
      presupuesto.total_estimado,
      presupuesto.costo_m2,
      presupuesto.divisa,
      JSON.stringify(presupuesto),
      JSON.stringify({
        validacion_tecnica: presupuesto.validacion_tecnica,
        reporte_qa: presupuesto.reporte_qa
      })
    ]);

    console.log(`[Orchestrator] Persistencia en DB exitosa para ${blueprint.id} v${blueprint.version}`);
  } catch (dbError: any) {
    console.error(`[Orchestrator] Error en persistencia DB: ${dbError.message}`);
    // No bloqueamos el flujo si falla la DB, seguimos con el archivo JSON
  }

  ensureDir(OUTPUT_DIR);
  const usuarioDir = path.join(OUTPUT_DIR, blueprint.usuario_id);
  ensureDir(usuarioDir);

  const timestamp = new Date().toISOString().replace(/:/g, "-").split('.')[0];
  const outputFile = path.join(usuarioDir, `${blueprint.id}_v${blueprint.version}_${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({ presupuesto, comparativo, extractionResult }, null, 2));
  
  // --- EXPORTACIÓN AUTOMÁTICA A EXCEL Y PDF (v7.0) ---
  try {
    console.log(`[Orchestrator] Generando exportaciones para ${blueprint.nombre_obra}...`);
    const excelPath = await excelGenerator.generarExcel(presupuesto, `Presupuesto_${blueprint.nombre_obra}_v${blueprint.version}`, comparativo);
    const pdfPath = await pdfGenerator.generarPDF(presupuesto, blueprint.nombre_obra, comparativo);
    
    logs.push(log("orchestrator", "export_excel", "ok", 0, `Excel: ${excelPath}`));
    logs.push(log("orchestrator", "export_pdf", "ok", 0, `PDF: ${pdfPath}`));

    // --- SINCRONIZACIÓN GOOGLE SHEETS (v7.5) ---
    const sheetsUrl = await googleSheetsService.exportarPresupuesto(presupuesto);
    if (sheetsUrl) {
      logs.push(log("orchestrator", "google_sheets_sync", "ok", 0, `Link: ${sheetsUrl}`));
      (presupuesto as any).google_sheets_url = sheetsUrl;
    }
  } catch (exportErr: any) {
    console.error(`[Orchestrator] Error en exportación: ${exportErr.message}`);
    logs.push(log("orchestrator", "export", "error", 0, exportErr.message));
  }

  logs.push(log("orchestrator", "save", "ok", 0, `Guardado en ${outputFile}`));

  // --- 10. SINCRONIZACIÓN CON GOOGLE DRIVE (PRO) ---
  try {
    const folderId = await driveService.createFolderStructure(blueprint.estudio_id, blueprint.nombre_obra);
    if (folderId) {
      await driveService.uploadFile(outputFile, `Presupuesto_${blueprint.nombre_obra}_v${blueprint.version}.json`, folderId);
      if (presupuesto.reporte_qa) {
        presupuesto.reporte_qa.sugerencias.push("📁 Sincronizado correctamente con tu Google Drive.");
      }
      console.log(`[Orchestrator] Drive Sync ok: ${blueprint.nombre_obra}`);
    }
  } catch (driveErr: any) {
    console.warn(`[Orchestrator] Drive Sync falló: ${driveErr.message}`);
  }

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