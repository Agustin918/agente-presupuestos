import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ObraCliente {
  nombre: string;
  fecha: string;
  ubicacion?: string;
  superficie_cubierta_m2: number;
  superficie_semicubierta_m2?: number;
  superficie_total_m2: number;
  rubros: RubroCliente[];
}

export interface RubroCliente {
  nombre: string;
  descripcion?: string;
  importe: number;
  porcentaje?: number;
}

export interface MaterialTecho {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export function parsePlanillaCliente(filepath: string): ObraCliente | null {
  try {
    const workbook = XLSX.readFile(filepath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

    const obra: ObraCliente = {
      nombre: '',
      fecha: '',
      superficie_cubierta_m2: 0,
      superficie_total_m2: 0,
      rubros: [],
    };

    let inRubros = false;
    let foundHeaders = false;

    for (const row of data) {
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').trim();

      // Nombre de obra
      if (firstCell.includes('OBRA') && !obra.nombre) {
        obra.nombre = firstCell.replace('OBRA', '').replace(/:\s*$/, '').trim();
        if (row[2]) {
          const fechaMatch = String(row[2]).match(/FECHA:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
          if (fechaMatch) {
            obra.fecha = fechaMatch[1];
          }
        }
        continue;
      }

      // Superficie
      const supCubMatch = String(row[0]).match(/superficie\s*(?:cubiert?a)?:\s*(\d+)/i);
      if (supCubMatch) {
        obra.superficie_cubierta_m2 = parseInt(supCubMatch[1]);
        obra.superficie_total_m2 = obra.superficie_cubierta_m2;
        continue;
      }

      const supSemiMatch = String(row[0]).match(/semicubiert?a:\s*(\d+)/i);
      if (supSemiMatch) {
        obra.superficie_semicubierta_m2 = parseInt(supSemiMatch[1]);
        obra.superficie_total_m2 += obra.superficie_semicubierta_m2;
        continue;
      }

      // Buscar ubicación
      if (firstCell.match(/barrio|lote|calle|manzana|barrio/i) && !obra.ubicacion) {
        obra.ubicacion = String(row[0]);
        continue;
      }

      // Detectar inicio de rubros
      if (firstCell.toLowerCase().includes('rubro') || firstCell.toLowerCase().includes('importe')) {
        foundHeaders = true;
        continue;
      }

      // Si encontramos "LISTADO DE MATERIALES" sin ser rubro, ignoramos
      if (firstCell.toLowerCase().includes('listado de materiales')) {
        inRubros = false;
        continue;
      }

      // Procesar rubros
      if (foundHeaders && row[0] && row[2]) {
        const rubroNombre = String(row[0]).trim();
        const rubroImporte = parseImporte(row[2]);

        if (rubroNombre && rubroImporte > 0) {
          obra.rubros.push({
            nombre: rubroNombre,
            descripcion: row[1] ? String(row[1]).trim() : undefined,
            importe: rubroImporte,
          });
        }
      }
    }

    // Calcular porcentajes
    const totalRubros = obra.rubros.reduce((sum, r) => sum + r.importe, 0);
    obra.rubros.forEach(r => {
      r.porcentaje = totalRubros > 0 ? (r.importe / totalRubros) * 100 : 0;
    });

    return obra;
  } catch (error) {
    console.error(`[Parser] Error parseando ${filepath}:`, error);
    return null;
  }
}

export function parsePlanillaTecho(filepath: string): MaterialTecho[] {
  try {
    const workbook = XLSX.readFile(filepath);
    const materials: MaterialTecho[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      for (const row of data) {
        if (!row || row.length < 3) continue;

        const nombre = String(row[1] || '').trim();
        const unidad = String(row[2] || '').trim();
        const cantidad = parseFloat(row[3]) || 0;

        // Filtrar solo materiales válidos
        if (nombre && unidad && cantidad > 0 && !nombre.includes('MATERIALES')) {
          materials.push({
            nombre,
            cantidad,
            unidad,
          });
        }
      }
    }

    return materials;
  } catch (error) {
    console.error(`[Parser] Error parseando techo ${filepath}:`, error);
    return [];
  }
}

function parseImporte(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Limpiar y convertir
    const cleaned = value.replace(/[$.\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function cargarObrasCliente(folderPath: string): ObraCliente[] {
  const obras: ObraCliente[] = [];

  if (!fs.existsSync(folderPath)) {
    console.log(`[Parser] Carpeta no existe: ${folderPath}`);
    return obras;
  }

  const files = fs.readdirSync(folderPath).filter(f => 
    (f.endsWith('.xls') || f.endsWith('.xlsx')) && 
    !f.toLowerCase().includes('techo')
  );

  for (const file of files) {
    const filepath = path.join(folderPath, file);
    const obra = parsePlanillaCliente(filepath);
    if (obra) {
      obras.push(obra);
      console.log(`[Parser] ✓ ${obra.nombre}: ${obra.superficie_total_m2}m², ${obra.rubros.length} rubros`);
    }
  }

  return obras;
}

export function cargarMaterialesTecho(folderPath: string): MaterialTecho[] {
  const allMaterials: MaterialTecho[] = [];

  if (!fs.existsSync(folderPath)) {
    return allMaterials;
  }

  const files = fs.readdirSync(folderPath).filter(f => 
    f.toLowerCase().includes('techo')
  );

  for (const file of files) {
    const filepath = path.join(folderPath, file);
    const materials = parsePlanillaTecho(filepath);
    allMaterials.push(...materials);
  }

  return allMaterials;
}

// Ratios típicos por m² derivados de las planillas del cliente
export function calcularRatios(obras: ObraCliente[]): Record<string, { promedio_m2: number; min_m2: number; max_m2: number }> {
  const ratios: Record<string, { suma: number; min: number; max: number; count: number }> = {};

  for (const obra of obras) {
    const m2 = obra.superficie_total_m2;
    if (m2 === 0) continue;

    for (const rubro of obra.rubros) {
      if (!ratios[rubro.nombre]) {
        ratios[rubro.nombre] = { suma: 0, min: Infinity, max: 0, count: 0 };
      }

      const ratio = rubro.importe / m2;
      ratios[rubro.nombre].suma += ratio;
      ratios[rubro.nombre].min = Math.min(ratios[rubro.nombre].min, ratio);
      ratios[rubro.nombre].max = Math.max(ratios[rubro.nombre].max, ratio);
      ratios[rubro.nombre].count++;
    }
  }

  const resultado: Record<string, { promedio_m2: number; min_m2: number; max_m2: number }> = {};
  for (const [nombre, data] of Object.entries(ratios)) {
    resultado[nombre] = {
      promedio_m2: Math.round(data.suma / data.count),
      min_m2: Math.round(data.min),
      max_m2: Math.round(data.max),
    };
  }

  return resultado;
}
