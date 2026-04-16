import * as XLSX from 'xlsx';
import * as path from 'path';

async function readExcel() {
  const filePath = path.join(__dirname, '../output/general/diagnostico_premium.xlsx');
  console.log('Leyendo:', filePath);
  
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  
  console.log('Hojas:', sheetNames);
  
  // Leer hoja de resumen (primera hoja)
  const summarySheet = workbook.Sheets['00-Informe_Ejecutivo'];
  if (!summarySheet) {
    console.error('No se encontró hoja 00-Informe_Ejecutivo');
    return;
  }
  
  const data = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
  console.log('Datos de resumen:');
  data.forEach((row: any, idx) => {
    console.log(`${idx}:`, row);
  });
  
  // Buscar "COSTO POR M²"
  for (const row of data) {
    if (Array.isArray(row) && row[0] === 'COSTO POR M²:') {
      console.log('\n✅ COSTO POR M² encontrado:', row[1]);
    }
    if (Array.isArray(row) && row[0] === 'TOTAL ESTIMADO:') {
      console.log('✅ TOTAL ESTIMADO encontrado:', row[1]);
    }
  }
}

readExcel().catch(console.error);