import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Presupuesto, PresupuestoComparativo, ItemPresupuesto } from '../blueprint/schema';

export class ExcelGenerator {
  /**
   * Genera un archivo Excel profesional y lo guarda en el disco.
   * Utiliza XLSX para máxima compatibilidad con Google Sheets y Windows.
   */
  async generarExcel(
    presupuesto: Presupuesto,
    nombreArchivo?: string,
    comparativo?: PresupuestoComparativo
  ): Promise<string> {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: `Presupuesto ${presupuesto.obra}`,
      Subject: "Construcción",
      Author: "Agente IA Arquitectura",
      CreatedDate: new Date()
    };

    // 1. HOJA: INFORME EJECUTIVO
    this.crearHojaResumen(wb, presupuesto);

    // 2. HOJA: DETALLE TÉCNICO
    this.crearHojaDetalle(wb, presupuesto);

    // 3. HOJA: ESCENARIOS (Si existe)
    if (comparativo) {
      this.crearHojaComparativo(wb, comparativo);
    }

    // Definir ruta y nombre
    const dirSalida = path.resolve('./output/presupuestos');
    if (!fs.existsSync(dirSalida)) fs.mkdirSync(dirSalida, { recursive: true });

    const safeName = (nombreArchivo || `Presupuesto_${presupuesto.obra}`)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    
    const filePath = path.join(dirSalida, `${safeName}.xlsx`);

    // Guardar usando buffer binario para evitar corrupción
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buf);

    console.log(`[ExcelGenerator] Archivo generado exitosamente en: ${filePath}`);
    return filePath;
  }

  private crearHojaResumen(wb: XLSX.WorkBook, p: Presupuesto) {
    const data = [
      ["INFORME DE PRESUPUESTO - ESTUDIO DE ARQUITECTURA"],
      [""],
      ["PROYECTO", p.obra],
      ["FECHA", p.fecha],
      ["SUPERFICIE CUBIERTA", p.superficie_m2 + " m2"],
      ["SISTEMA CONSTRUCTIVO", p.estructura.toUpperCase()],
      ["CATEGORÍA DE TERMINACIONES", p.categoria.toUpperCase()],
      [""],
      ["RESUMEN ECONÓMICO"],
      ["TOTAL INVERSIÓN ESTIMADA", p.total_estimado],
      ["COSTO POR M2 (PROMEDIO)", p.costo_m2],
      ["DIVISA", "DÓLARES (USD) BLUE"],
      [""],
      ["AUDITORÍA DE INTELIGENCIA"],
      ["Precios Validados Hoy", p.precios_frescos],
      ["Precios de Referencia", p.precios_cache],
      ["Estado Técnico", p.validacion_tecnica?.resultado.toUpperCase() || "PENDIENTE"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ancho de columnas
    ws['!cols'] = [{ wch: 30 }, { wch: 45 }];
    
    XLSX.utils.book_append_sheet(wb, ws, "00-Informe_Ejecutivo");
  }

  private crearHojaDetalle(wb: XLSX.WorkBook, p: Presupuesto) {
    const headers = [
        "Rubro", 
        "Descripción Técnica", 
        "Cant.", 
        "Unidad", 
        "PU (USD)", 
        "Subtotal (USD)", 
        "Fuente", 
        "Confianza IA"
    ];

    const rows = p.items.map(i => [
      i.rubro,
      i.descripcion,
      i.cantidad,
      i.unidad,
      i.precio_unitario,
      i.subtotal,
      i.fuente_url || i.fuente,
      i.confianza.toUpperCase()
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, { wch: 45 }, { wch: 10 }, { wch: 10 }, 
      { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "01-Detalle_Tecnico");
  }

  private crearHojaComparativo(wb: XLSX.WorkBook, c: PresupuestoComparativo) {
    const headers = ["Categoría", "Factor de Escala", "Inversión Total", "Variación vs Base"];
    const rows = c.escenarios.map(e => [
      e.categoria.toUpperCase(),
      e.factor,
      e.total_estimado,
      e.diferencia_vs_economico
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "02-Comparativa_Calidad");
  }
}

export const excelGenerator = new ExcelGenerator();