import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Presupuesto, PresupuestoComparativo, ItemPresupuesto } from '../blueprint/schema';

export class ExcelGenerator {
  async generarExcel(
    presupuesto: Presupuesto,
    nombreArchivo?: string,
    comparativo?: PresupuestoComparativo
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Agente IA Presupuestos';
    workbook.lastModifiedBy = 'Agente IA Presupuestos';
    workbook.created = new Date();

    // 1. HOJA: RESUMEN EJECUTIVO
    const sheetResumen = workbook.addWorksheet('00-Resumen Ejecutivo');
    this.estilizarResumen(sheetResumen, presupuesto);

    // 2. HOJA: DETALLE POR ETAPAS
    const sheetDetalle = workbook.addWorksheet('01-Detalle de Obra');
    this.estilizarDetalle(sheetDetalle, presupuesto);

    // 3. HOJA: COMPARATIVO (si existe)
    if (comparativo) {
      const sheetComp = workbook.addWorksheet('02-Comparativo Calidad');
      this.estilizarComparativo(sheetComp, comparativo);
    }

    // Guardar archivo
    const rutaSalida = './output/general';
    if (!fs.existsSync(rutaSalida)) fs.mkdirSync(rutaSalida, { recursive: true });

    const fileName = nombreArchivo || `Presupuesto_${presupuesto.obra.replace(/\s+/g, '_')}.xlsx`;
    const filePath = path.join(rutaSalida, fileName);

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private estilizarResumen(sheet: ExcelJS.Worksheet, p: Presupuesto) {
    sheet.columns = [{ width: 30 }, { width: 50 }];
    
    // Título
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'INFORME TÉCNICO DE PRESUPUESTO';
    titleCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Datos
    const rows = [
      ['PROYECTO:', p.obra],
      ['FECHA:', p.fecha],
      ['SUPERFICIE:', `${p.superficie_m2} m²`],
      ['SISTEMA:', p.estructura.toUpperCase()],
      ['CATEGORÍA:', p.categoria.toUpperCase()],
      [''],
      ['INVERSIÓN ESTIMADA TOTAL:', p.total_estimado],
      ['COSTO POR METRO CUADRADO:', p.costo_m2],
      ['DIVISA:', p.divisa],
      [''],
      ['AUDITORÍA DE PRECIOS'],
      ['Precios verificados hoy:', p.precios_frescos],
      ['Precios de base histórica:', p.precios_cache],
      [''],
      ['CONSISTENCIA TÉCNICA:', p.validacion_tecnica?.resultado.toUpperCase()]
    ];

    sheet.addRows(rows);

    // Estilos de labels
    sheet.getColumn(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Color al total
    const totalCell = sheet.getCell('B8');
    totalCell.font = { bold: true, size: 14, color: { argb: 'FF27AE60' } };
    totalCell.numFmt = '"$"#,##0.00';
  }

  private estilizarDetalle(sheet: ExcelJS.Worksheet, p: Presupuesto) {
    const headers = ['RUBRO / ETAPA', 'DESCRIPCIÓN TÉCNICA', 'CANT.', 'UNID.', 'PU', 'SUBTOTAL', 'FUENTE (AUDITORÍA)', 'LINK'];
    sheet.addRow(headers);
    
    // Estilo headers
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };

    p.items.forEach(item => {
      const row = sheet.addRow([
        item.rubro,
        item.descripcion,
        item.cantidad,
        item.unidad,
        item.precio_unitario,
        item.subtotal,
        item.fuente,
        item.fuente_url
      ]);

      // Link clickable
      if (item.fuente_url) {
        row.getCell(8).value = { text: 'Ver Fuente', hyperlink: item.fuente_url };
        row.getCell(8).font = { underline: true, color: { argb: 'FF2980B9' } };
      }
    });

    // Formatos de número
    sheet.getColumn(5).numFmt = '#,##0.00';
    sheet.getColumn(6).numFmt = '#,##0.00';
    
    sheet.columns = [
      { width: 25 }, { width: 40 }, { width: 10 }, { width: 8 }, { width: 15 }, { width: 15 }, { width: 25 }, { width: 15 }
    ];

    // Subtotales por categoría (opcional, aquí simplificado)
    const lastRow = sheet.rowCount + 2;
    sheet.getCell(`E${lastRow}`).value = 'TOTAL ESTIMADO:';
    sheet.getCell(`E${lastRow}`).font = { bold: true };
    sheet.getCell(`F${lastRow}`).value = p.total_estimado;
    sheet.getCell(`F${lastRow}`).font = { bold: true };
    sheet.getCell(`F${lastRow}`).numFmt = '"$"#,##0.00';
  }

  private estilizarComparativo(sheet: ExcelJS.Worksheet, c: PresupuestoComparativo) {
    sheet.addRow(['ANALISIS COMPARATIVO DE ESCENARIOS DE CALIDAD']);
    sheet.addRow(['Escenario', 'Factor', 'Total Estimado', 'Variación %']);
    
    c.escenarios.forEach(e => {
      sheet.addRow([
        e.categoria.toUpperCase(),
        e.factor,
        e.total_estimado,
        e.diferencia_vs_economico
      ]);
    });

    sheet.getColumn(3).numFmt = '"$"#,##0.00';
    sheet.columns = [{ width: 20 }, { width: 10 }, { width: 20 }, { width: 20 }];
  }
}

export const excelGenerator = new ExcelGenerator();