const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/MSI/Documents/agente-presupuestos/data/cliente';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));

files.forEach(file => {
    console.log(`\n--- File: ${file} ---`);
    const workbook = XLSX.readFile(path.join(dir, file));
    console.log('Sheets:', workbook.SheetNames);
    
    // Print first 5 rows of the first sheet to see the structure
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    console.log('First 5 rows of first sheet:');
    console.log(data.slice(0, 5));
});
