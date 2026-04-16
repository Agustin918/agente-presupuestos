import { orchestrator } from "./agents/orchestrator";
import { Blueprint } from "./blueprint/schema";

async function validateSystem() {
  console.log("--- INICIANDO VALIDACIÓN TÉCNICA FINAL (REINTENTO) ---");

  const testBlueprint: Partial<Blueprint> = {
    id: "test_" + Date.now(),
    version: 1,
    nombre_obra: "TEST FINAL ROCIO",
    ubicacion: "Belén de Escobar, Buenos Aires",
    superficie_cubierta_m2: 150,
    superficie_semicubierta_m2: 70,
    estructura: "albanileria",
    categoria: "estandar",
    factor_terminacion: 1.35,
    usuario_id: "user_123",
    estudio_id: "estudio_001",
    escenarios: false,
    instalaciones: ["electrica", "sanitaria", "gas"],
    terreno: { tipo: "lote_propio" },
    plantas: 1,
    dormitorios: 3,
    cantidad_banos: 2,
    tiene_planos: "anteproyecto",
    plazo_meses: 12,
    modalidad: "llave_en_mano",
    aberturas: "aluminio_dvh",
    pisos: "porcelanato",
    cubierta: "techo_verde",
    fecha_creacion: new Date().toISOString()
  };

  try {
    console.log("[Test] Corriendo orquestador...");
    const resultado = await orchestrator.runWithFiles([], testBlueprint);

    if (resultado.exito && resultado.presupuesto) {
      const p = resultado.presupuesto;
      const total = p.total_estimado;
      const m2 = p.superficie_m2;
      const ratio = p.costo_m2;

      console.log(`[OK] Presupuesto generado.`);
      console.log(`[OK] Superficie: ${m2}m2`);
      console.log(`[OK] Total: $${total} USD`);
      console.log(`[OK] Ratio: $${ratio} USD/m2`);

      if (ratio >= 1000 && ratio <= 1800) {
        console.log("--- VALIDACIÓN EXITOSA: EL SISTEMA ES TÉCNICAMENTE SÓLIDO ---");
        process.exit(0);
      } else {
        console.error(`--- ERROR: Ratio de $${ratio}/m2 fuera de mercado. Re-ajustar llm.ts ---`);
        process.exit(1);
      }
    } else {
      console.error("[FAIL] Errores:", resultado.errores);
      process.exit(1);
    }
  } catch (error) {
    console.error("[CRITICAL] Error fatal en ejecución:", error);
    process.exit(1);
  }
}

validateSystem();
