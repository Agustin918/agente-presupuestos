import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { orchestrator } from "./agents/orchestrator";

async function auditOutput() {
  console.log("--- INICIANDO AUDITORÍA FORENSE DE SALIDA (V7.1) ---");

  const testBlueprint: any = {
    id: "audit_" + Date.now(),
    version: 1,
    nombre_obra: "ROCIOV7",
    ubicacion: "Escobar",
    superficie_cubierta_m2: 150,
    estructura: "albanileria",
    categoria: "estandar",
    factor_terminacion: 1.35,
    usuario_id: "auditor",
    estudio_id: "estudio_001",
    plazo_meses: 10,
    modalidad: "llave_en_mano",
    terreno: { tipo: "lote_propio" },
    plantas: 1,
    dormitorios: 2,
    cantidad_banos: 1,
    tiene_planos: "sin_planos",
    instalaciones: ["electrica"],
    aberturas: "aluminio_basico",
    pisos: "ceramico",
    cubierta: "chapa_acanalada",
    fecha_creacion: new Date().toISOString()
  };

  try {
    const res = await orchestrator.runWithFiles([], testBlueprint);
    if (!res.exito) throw new Error("Fallo orquestador");

    const excelPath = `./output/presupuestos/Presupuesto_ROCIOV7_v1.xlsx`;
    console.log(`[Audit] Verificando existencia de: ${excelPath}`);

    if (!fs.existsSync(excelPath)) {
        // Buscar cualquier archivo similar por si acaso
        const files = fs.readdirSync('./output/presupuestos');
        console.log("[Audit] Archivos encontrados en el folder:", files);
        throw new Error("El archivo no fue creado con el nombre esperado");
    }

    // Intentar leer el archivo con XLSX (Simula lo que hace Sheets/Excel)
    const workbook = XLSX.readFile(excelPath);
    
    console.log(`[Audit] Archivo abierto exitosamente.`);
    console.log(`[Audit] Pestañas encontradas: ${workbook.SheetNames.join(", ")}`);

    if (workbook.SheetNames.length < 2) throw new Error("Faltan pestañas en el Excel");

    console.log("--- ✅ SISTEMA VALIDADO Y EXCEL LEGIBLE ---");
    process.exit(0);
  } catch (err: any) {
    console.error("--- ❌ FALLO DE AUDITORÍA ---");
    console.error(err.message);
    process.exit(1);
  }
}

auditOutput();
