import { orchestrator } from "./agents/orchestrator";
import { extractionAgent } from "./agents/extraction_agent";
import { researchAgent } from "./agents/research_agent";
import { synthesisAgent } from "./agents/synthesis_agent";
import { ingestaAgent } from "./agents/ingesta_agent";
import { excelGenerator } from "./output/excel_generator";

async function demo() {
  console.log("=== Demo Sistema de Presupuestos ===\n");

  // 1. Extracción de datos desde archivos
  console.log("1. Probando Extraction Agent...");
  const extraction = await extractionAgent.extractFromFiles(["demo.pdf"]);
  console.log(`   Extraídos ${Object.keys(extraction.blueprint_parcial).length} campos`);
  console.log(`   Confianza: ${Object.values(extraction.confianza).filter(c => c === "alta").length} alta, ${Object.values(extraction.confianza).filter(c => c === "media").length} media`);

  // 2. Búsqueda de precios
  console.log("\n2. Probando Research Agent...");
  const precios = await researchAgent.getPrices(["ladrillo", "cemento"], "Pilar, Buenos Aires");
  console.log(`   Obtenidos ${Object.keys(precios).length} precios`);

  // 3. Generación de presupuesto
  console.log("\n3. Probando Synthesis Agent...");
  const blueprint = {
    id: "demo_" + Date.now(),
    version: 1,
    usuario_id: "demo",
    estudio_id: "estudio_001",
    fecha_creacion: new Date().toISOString().split("T")[0],
    nombre_obra: "Casa Demo",
    ubicacion: "Pilar, Buenos Aires",
    superficie_cubierta_m2: 120,
    superficie_semicubierta_m2: 20,
    plantas: 1,
    tiene_planos: "aprobados",
    dormitorios: 3,
    cantidad_banos: 2,
    tiene_cochera: true,
    tipo_cochera: "cubierta",
    tiene_quincho: false,
    tiene_galeria: true,
    tiene_deck: true,
    superficie_deck_m2: 15,
    cocina_equipada: true,
    estructura: "albanileria",
    cubierta: "chapa_acanalada",
    tiene_escalera: false,
    categoria: "estandar",
    factor_terminacion: 1.35,
    pisos: "ceramico",
    cielorraso: "suspendido",
    aberturas: "aluminio_dvh",
    revestimiento_exterior: "revoque_fino",
    porton_cerco: true,
    material_cerco: "metalico",
    instalaciones: ["electrica", "sanitaria", "gas"],
    calentador_agua: "termotanque_gas",
    tiene_cisterna: false,
    tiene_tanque_elevado: true,
    terreno: {
      tipo: "lote_propio",
      zona_inundable: false,
    },
    plazo_meses: 8,
    modalidad: "llave_en_mano",
  };

  const presupuesto = await synthesisAgent.generarPresupuesto(blueprint as any, precios);
  console.log(`   Presupuesto generado: $${presupuesto.total_estimado.toLocaleString()}`);
  console.log(`   Items: ${presupuesto.items.length}, Confianza alta: ${presupuesto.items.filter(i => i.confianza === "alta").length}`);

  // 4. Generación de Excel
  console.log("\n4. Probando Excel Generator...");
  const rutaExcel = await excelGenerator.generarExcel(presupuesto, "demo");
  console.log(`   HTML generado: ${rutaExcel}`);

  // 5. Orquestador completo
  console.log("\n5. Probando Orquestador completo...");
  const resultado = await orchestrator.runWithFiles([], blueprint as any);
  if (resultado.exito) {
    console.log(`   ✅ Orquestador exitoso. Versión ${resultado.version}`);
    console.log(`   Total: $${resultado.presupuesto?.total_estimado.toLocaleString()}`);
  } else {
    console.log(`   ❌ Error: ${resultado.errores.join(", ")}`);
  }

  console.log("\n=== Demo completado ===");
}

demo().catch(console.error);