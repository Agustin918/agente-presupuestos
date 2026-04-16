const { excelGenerator } = require('../output/excel_generator');
const path = require('path');

const mockPresupuesto = {
  obra: "Test Obra",
  fecha: "2026-04-15",
  superficie_m2: 200,
  estructura: "Steel Frame",
  categoria: "estandar",
  factor_terminacion: 1.35,
  total_estimado: 180000,
  costo_m2: 900,
  divisa: "USD",
  items: [
    { rubro: "Cimientos", descripcion: "Plateado", unidad: "m2", cantidad: 200, precio_unitario: 50, subtotal: 10000, categoria: "02 - Estructura" },
    { rubro: "Piso", descripcion: "Ceramico", unidad: "m2", cantidad: 100, precio_unitario: 15, subtotal: 1500, categoria: "04 - Terminaciones" }
  ],
  precios_frescos: 2,
  precios_cache: 0,
  usuario_id: 'test_user'
};

async function test() {
  try {
    const file = await excelGenerator.generarExcel(mockPresupuesto, "Test_Obra");
    console.log("File generated at:", file);
  } catch (e) {
    console.error("Failed:", e);
  }
}

test();
