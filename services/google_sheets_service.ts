import { google } from 'googleapis';
import { Presupuesto } from '../blueprint/schema';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor() {
    const credentialsPath = path.resolve('./config/google_credentials.json');
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      this.auth = new google.auth.JWT();
      this.auth.fromJSON(credentials);
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }
  }

  async exportarPresupuesto(p: Presupuesto): Promise<string | null> {
    if (!this.sheets) return null;

    try {
      const title = `LIBRO DE OBRA - ${p.obra.toUpperCase()} - ${p.fecha}`;
      const spreadsheet = await this.sheets.spreadsheets.create({
        resource: { properties: { title } }
      });
      const spreadsheetId = spreadsheet.data.spreadsheetId;

      // 1. Formatear la estructura base
      const values = [
        ['ESTUDIO DE ARQUITECTURA - SISTEMA DE PRESUPUESTOS IA v8.0'],
        [''],
        ['PROYECTO:', p.obra],
        ['FECHA:', p.fecha],
        ['SUPERFICIE:', `${p.superficie_m2} m2`],
        ['CATEGORÍA:', p.categoria.toUpperCase()],
        [''],
        ['RESUMEN DE INVERSIÓN (VALORES EN USD BLUE)'],
        ['TOTAL ESTIMADO:', p.total_estimado],
        ['COSTO POR M2:', p.costo_m2],
        [''],
        ['DETALLE TÉCNICO POR RUBROS'],
        ['RUBRO', 'ESPECIFICACIÓN', 'CANTIDAD', 'UNIDAD', 'P.U. (USD)', 'SUBTOTAL (USD)', 'CONFIANZA']
      ];

      p.items.forEach(i => {
        values.push([
          i.rubro,
          i.descripcion,
          i.cantidad,
          i.unidad,
          i.precio_unitario,
          i.subtotal,
          i.confianza.toUpperCase()
        ]);
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });

      // 2. Aplicar Estilo Profesional (API de BatchUpdate)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            // Negrita encabezados
            { repeatCell: { range: { startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat(textFormat)' } },
            // Color al total
            { repeatCell: { range: { startRowIndex: 8, endRowIndex: 9, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: { red: 0.1, green: 0.5, blue: 0.2 } }, numberFormat: { type: 'CURRENCY', pattern: '$#,##0' } } }, fields: 'userEnteredFormat(textFormat,numberFormat)' } },
            // Encabezado de tabla oscuro
            { repeatCell: { range: { startRowIndex: 12, endRowIndex: 13 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.1, green: 0.2, blue: 0.3 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } }
          ]
        }
      });

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    } catch (error) {
      console.error('[GoogleSheets] Error:', error);
      return null;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
