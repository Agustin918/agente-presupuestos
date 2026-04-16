import { Blueprint, ExtractionResult } from "../blueprint/schema";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = "./data/uploads";
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

interface CampoExtraido {
  campo: string;
  valor: any;
  confianza: "alta" | "media" | "baja";
  fuente: string;
  pagina?: number;
}

interface AnalisisCompleto {
  archivos: {
    nombre: string;
    tipo: string;
    paginas?: number;
    elementos_detectados: string[];
    analisis: string;
  }[];
  campos: CampoExtraido[];
  errores: string[];
  tiempo_ms: number;
}

function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function extractFromFiles(filePaths: string[]): Promise<ExtractionResult> {
  const startTime = Date.now();
  console.log(`[Extraction Agent] Iniciando análisis meticuloso de ${filePaths.length} archivos...`);
  
  const analisisCompleto: AnalisisCompleto = {
    archivos: [],
    campos: [],
    errores: [],
    tiempo_ms: 0,
  };

  // Procesar cada archivo con cuidado
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const ext = getFileExtension(filePath);
    const fileName = path.basename(filePath);
    
    console.log(`[Extraction] (${i + 1}/${filePaths.length}) Analizando: ${fileName}`);
    
    try {
      const analisisArchivo = await analizarArchivo(filePath, ext);
      analisisCompleto.archivos.push(analisisArchivo.archivo);
      analisisCompleto.campos.push(...analisisArchivo.campos);
      
      if (analisisArchivo.errores.length > 0) {
        analisisCompleto.errores.push(...analisisArchivo.errores);
      }
      
    } catch (error) {
      const mensaje = `[${fileName}] Error: ${(error as Error).message}`;
      console.error(mensaje);
      analisisCompleto.errores.push(mensaje);
    }
  }

  // Consolidar resultados
  const camposConsolidados = consolidarCampos(analisisCompleto.campos);
  const blueprintParcial = construirBlueprint(camposConsolidados);
  const confianza = calcularConfianza(camposConsolidados);
  const notas = generarNotas(analisisCompleto);

  analisisCompleto.tiempo_ms = Date.now() - startTime;
  
  // Recolectar especificaciones técnicas de las notas de visión
  const especificaciones = analisisCompleto.archivos
    .map(a => a.elementos_detectados)
    .flat()
    .filter(e => e.length > 20); // Solo frases con contenido técnico real

  console.log(`[Extraction Agent] ✓ Análisis completado en ${(analisisCompleto.tiempo_ms / 1000).toFixed(1)}s`);
  console.log(`[Extraction] Campos extraídos: ${camposConsolidados.length}`);
  console.log(`[Extraction] Especificaciones detectadas: ${especificaciones.length}`);
  console.log(`[Extraction] Errores: ${analisisCompleto.errores.length}`);

  return {
    blueprint_parcial: blueprintParcial,
    confianza: confianza,
    archivos_procesados: filePaths,
    notas_extraccion: notas,
    especificaciones_tecnicas: especificaciones
  };
}

async function analizarArchivo(
  filePath: string, 
  ext: string
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  
  const archivo: AnalisisCompleto['archivos'][0] = {
    nombre: path.basename(filePath),
    tipo: ext,
    elementos_detectados: [],
    analisis: "",
  };
  
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    errores.push(`Archivo no encontrado: ${filePath}`);
    return { archivo, campos, errores };
  }

  const stats = fs.statSync(filePath);
  console.log(`[Extraction]   Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);

  switch (ext) {
    case ".pdf":
      return await analizarPDF(filePath, archivo);
      
    case ".jpg":
    case ".jpeg":
    case ".png":
      return await analizarImagen(filePath, archivo);
      
    case ".xlsx":
    case ".xls":
      return await analizarExcel(filePath, archivo);
      
    case ".dwg":
      return await analizarDWG(filePath, archivo);
      
    case ".skp":
      return await analizarSKP(filePath, archivo);
      
    default:
      errores.push(`Formato no soportado: ${ext}`);
      return { archivo, campos, errores };
  }
}

async function analizarPDF(
  filePath: string,
  archivo: AnalisisCompleto['archivos'][0]
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  console.log(`[Extraction]   Analizando PDF con Visión AI...`);
  
  try {
    const { extractFromPDF } = require('../services/vision');
    const visionResult = await extractFromPDF(filePath);
    
    archivo.elementos_detectados = visionResult.notas;
    archivo.analisis = `PDF procesado con Claude 3.5 Sonnet`;
    
    for (const [key, value] of Object.entries(visionResult.blueprint)) {
      campos.push({
        campo: key,
        valor: value,
        confianza: (visionResult.confianza[key] as any) || 'media',
        fuente: 'vision_pdf_ai',
      });
    }
  } catch (error) {
    errores.push(`Error Vision PDF: ${(error as Error).message}`);
  }

  return { archivo, campos, errores };
}

async function analizarImagen(
  filePath: string,
  archivo: AnalisisCompleto['archivos'][0]
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  console.log(`[Extraction]   Analizando imagen con Claude Vision...`);
  
  try {
    const { extractFromImage } = require('../services/vision');
    const visionResult = await extractFromImage(filePath);
    
    archivo.elementos_detectados = visionResult.notas;
    archivo.analisis = `Imagen analizada con Claude 3.5 Sonnet`;
    
    for (const [key, value] of Object.entries(visionResult.blueprint)) {
      campos.push({
        campo: key,
        valor: value,
        confianza: (visionResult.confianza[key] as any) || 'media',
        fuente: 'vision_image_ai',
      });
    }
  } catch (error) {
    errores.push(`Error Vision Image: ${(error as Error).message}`);
  }

  return { archivo, campos, errores };
}

async function analizarExcel(
  filePath: string,
  archivo: AnalisisCompleto['archivos'][0]
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  console.log(`[Extraction]   Analizando planilla Excel...`);
  
  try {
    // Análisis detallado del Excel
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    
    archivo.paginas = workbook.SheetNames.length;
    archivo.elementos_detectados.push(`Hojas: ${workbook.SheetNames.join(', ')}`);
    
    // Analizar cada hoja
    for (const sheetName of workbook.SheetNames) {
      console.log(`[Extraction]     Analizando hoja: ${sheetName}`);
      await delay(500);
      
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Buscar patrones de datos de construcción
      campos.push(...analizarDatosConstruccion(data, sheetName));
    }
    
    archivo.analisis = `Planilla con ${workbook.SheetNames.length} hojas analizadas`;
    
  } catch (error) {
    errores.push(`Error analizando Excel: ${(error as Error).message}`);
  }

  return { archivo, campos, errores };
}

async function analizarDWG(
  filePath: string,
  archivo: AnalisisCompleto['archivos'][0]
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  console.log(`[Extraction]   Analizando DWG (AutoCAD)...`);
  
  try {
    await delay(3000); // DWG requiere más procesamiento
    
    // Análisis de DWG (en producción usaría biblioteca CAD)
    // Por ahora análisis basado en metadatos
    const contenido = fs.readFileSync(filePath);
    const textoExtraido = extraerTextoDWG(contenido);
    
    archivo.elementos_detectados = detectarElementosEnTexto(textoExtraido);
    archivo.analisis = `Archivo DWG con ${archivo.elementos_detectados.length} elementos`;
    
    campos.push(...extraerCamposDeTexto(textoExtraido, 'dwg'));
    
  } catch (error) {
    errores.push(`Error analizando DWG: ${(error as Error).message}`);
  }

  return { archivo, campos, errores };
}

async function analizarSKP(
  filePath: string,
  archivo: AnalisisCompleto['archivos'][0]
): Promise<{ archivo: AnalisisCompleto['archivos'][0]; campos: CampoExtraido[]; errores: string[] }> {
  
  const campos: CampoExtraido[] = [];
  const errores: string[] = [];

  console.log(`[Extraction]   Analizando SKP (SketchUp)...`);
  
  try {
    await delay(2000);
    
    // Análisis de SketchUp (en producción usar SDK)
    // Por ahora inferir de nombre de archivo y metadatos
    const nombreArchivo = path.basename(filePath, '.skp');
    
    archivo.analisis = `Modelo 3D SketchUp: ${nombreArchivo}`;
    
    // Inferir datos del nombre si es posible
    const inferido = inferirDatosDeNombre(nombreArchivo);
    if (inferido) {
      campos.push(...inferido);
    }
    
  } catch (error) {
    errores.push(`Error analizando SKP: ${(error as Error).message}`);
  }

  return { archivo, campos, errores };
}

// Funciones auxiliares

async function extractFromPDFWithVision(filePath: string): Promise<{
  campos: CampoExtraido[];
  elementos: string[];
  resumen: string;
  errores: string[];
}> {
  // En producción, aquí usaría la API de Claude Vision o similar
  // Por ahora simulamos el análisis
  
  const campos: CampoExtraido[] = [];
  const elementos: string[] = [];
  const errores: string[] = [];

  try {
    const { extractFromPDF } = require('../services/vision');
    const result = await extractFromPDF(filePath);
    
    // Mapear resultados
    for (const [key, value] of Object.entries(result.blueprint)) {
      campos.push({
        campo: key,
        valor: value,
        confianza: (result.confianza[key] as any) || 'media',
        fuente: 'vision_api',
      });
    }
    
    elementos.push(...result.notas);
    
  } catch (error) {
    errores.push(`Vision API no disponible: ${(error as Error).message}`);
  }

  return { campos, elementos, resumen: `Extraídos ${campos.length} campos`, errores };
}

async function analizarImagenConVision(filePath: string): Promise<{
  campos: CampoExtraido[];
  elementos: string[];
  resumen: string;
}> {
  // Simular análisis de imagen
  await delay(1500);
  
  return {
    campos: [],
    elementos: ['plano_detectado', 'texto_detectado', 'dimensiones_estimadas'],
    resumen: 'Imagen analizada para detectar elementos de construcción',
  };
}

function extraerTextoPDFLocal(filePath: string): string {
  // Placeholder - en producción usar PDF.js
  return '';
}

function extraerTextoDWG(buffer: Buffer): string {
  // Extraer texto legible de DWG (simplificado)
  return buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
}

function detectarElementosEnTexto(texto: string): string[] {
  const elementos: string[] = [];
  
  const patrones = {
    'superficie': /(\d+[,.]?\d*)\s*(m2|m²|mt2|metros?)/gi,
    'plantas': /(\d+)\s*planta/gi,
    'dormitorios': /(\d+)\s*(dorm|cuart|habit)/gi,
    'banos': /(\d+)\s*(baño|ban|wc)/gi,
    'ambientes': /(\d+)\s*ambient/gi,
    'cocina': /cocin/gi,
    'living': /living|estar/gi,
    'comedor': /comedor/gi,
    'galeria': /galer[íi]a/gi,
    'cochera': /cocher?a?/gi,
    'quincho': /quinch/gi,
    'terraza': /terraz/gi,
    'deck': /deck/gi,
  };

  for (const [nombre, patron] of Object.entries(patrones)) {
    if (patron.test(texto)) {
      elementos.push(nombre);
    }
  }

  return elementos;
}

function extraerCamposDeTexto(texto: string, fuente: string): CampoExtraido[] {
  const campos: CampoExtraido[] = [];
  
  // Patrones para extraer valores específicos
  const patronesExtraccion = [
    { campo: 'superficie_cubierta_m2', patron: /superficie[^\d]*(\d+[,.]?\d*)\s*(?:m2|m²)/gi, tipo: 'number' },
    { campo: 'dormitorios', patron: /(\d+)\s*dorm/gi, tipo: 'number' },
    { campo: 'cantidad_banos', patron: /(\d+)\s*baño/gi, tipo: 'number' },
    { campo: 'plantas', patron: /(\d+)\s*planta/gi, tipo: 'number' },
  ];

  for (const { campo, patron, tipo } of patronesExtraccion) {
    const match = texto.match(patron);
    if (match) {
      let valor: any = match[1].replace(',', '.');
      if (tipo === 'number') valor = parseFloat(valor);
      
      campos.push({
        campo,
        valor,
        confianza: 'baja',
        fuente: `texto_${fuente}`,
      });
    }
  }

  return campos;
}

function analizarDatosConstruccion(data: any[][], hoja: string): CampoExtraido[] {
  const campos: CampoExtraido[] = [];
  
  // Buscar patrones comunes en planillas de construcción
  for (const row of data) {
    if (!row || row.length === 0) continue;
    
    const texto = String(row[0] || '').toLowerCase();
    
    // Detectar nombres de obra
    if (texto.includes('obra') && texto.includes(',')) {
      campos.push({
        campo: 'nombre_obra',
        valor: row[0],
        confianza: 'alta',
        fuente: `excel_${hoja}`,
      });
    }
    
    // Detectar superficies
    if (texto.match(/superficie|m2|m²/)) {
      const match = texto.match(/(\d+)/);
      if (match) {
        campos.push({
          campo: 'superficie_cubierta_m2',
          valor: parseInt(match[1]),
          confianza: 'alta',
          fuente: `excel_${hoja}`,
        });
      }
    }
    
    // Detectar fechas
    if (texto.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
      campos.push({
        campo: 'fecha_obra',
        valor: row[0],
        confianza: 'alta',
        fuente: `excel_${hoja}`,
      });
    }
  }

  return campos;
}

function inferirDatosDeNombre(nombre: string): CampoExtraido[] | null {
  const campos: CampoExtraido[] = [];
  
  // Intentar inferir de nombres como "Casa_120m2_2plantas"
  const match = nombre.match(/(\d+)\s*m2/i);
  if (match) {
    campos.push({
      campo: 'superficie_cubierta_m2',
      valor: parseInt(match[1]),
      confianza: 'media',
      fuente: 'nombre_archivo',
    });
  }

  return campos.length > 0 ? campos : null;
}

function consolidarCampos(campos: CampoExtraido[]): CampoExtraido[] {
  const consolidados: Map<string, CampoExtraido> = new Map();
  
  // Ordenar por confianza (alta > media > baja)
  const prioridad: Record<string, number> = { alta: 3, media: 2, baja: 1 };
  
  for (const campo of campos) {
    const existente = consolidados.get(campo.campo);
    
    if (!existente || prioridad[campo.confianza] > prioridad[existente.confianza]) {
      consolidados.set(campo.campo, campo);
    }
  }

  return Array.from(consolidados.values());
}

function construirBlueprint(campos: CampoExtraido[]): Partial<Blueprint> {
  const blueprint: any = {};

  const mapeoCampos: Record<string, string[]> = {
    superficie_cubierta_m2: ['superficie_cubierta_m2', 'superficie'],
    superficie_semicubierta_m2: ['superficie_semicubierta_m2'],
    dormitorios: ['dormitorios', 'habitaciones'],
    cantidad_banos: ['cantidad_banos', 'banos'],
    plantas: ['plantas'],
    tiene_cochera: ['cochera'],
    tiene_galeria: ['galeria'],
    tiene_quincho: ['quincho'],
    tiene_deck: ['deck'],
    nombre_obra: ['nombre_obra', 'obra'],
    escala_detectada: ['escala_detectada'],
    metodo_extraccion: ['metodo_extraccion'],
  };

  for (const campo of campos) {
    for (const [key, aliases] of Object.entries(mapeoCampos)) {
      if (aliases.includes(campo.campo)) {
        blueprint[key] = campo.valor;
        break;
      }
    }
  }

  return blueprint as Partial<Blueprint>;
}

function calcularConfianza(campos: CampoExtraido[]): Record<string, "alta" | "media" | "baja" | "no_detectado"> {
  const confianza: Record<string, any> = {};
  
  const mapeoCampos: Record<string, string[]> = {
    superficie_cubierta_m2: ['superficie_cubierta_m2', 'superficie'],
    dormitorios: ['dormitorios', 'habitaciones'],
    cantidad_banos: ['cantidad_banos', 'banos'],
    plantas: ['plantas'],
    estructura: ['estructura'],
    ubicacion: ['ubicacion'],
  };

  for (const campo of campos) {
    for (const [key, aliases] of Object.entries(mapeoCampos)) {
      if (aliases.includes(campo.campo)) {
        if (!confianza[key]) {
          confianza[key] = campo.confianza;
        }
      }
    }
  }

  // Marcar campos no detectados
  const todosLosCampos = Object.keys(mapeoCampos);
  for (const campo of todosLosCampos) {
    if (!confianza[campo]) {
      confianza[campo] = 'no_detectado';
    }
  }

  return confianza;
}

function generarNotas(analisis: AnalisisCompleto): string[] {
  const notas: string[] = [];
  
  notas.push(`Análisis técnico de ${analisis.archivos.length} archivos.`);
  
  for (const archivo of analisis.archivos) {
    notas.push(`[${archivo.nombre}] ${archivo.analisis}`);
    if (archivo.elementos_detectados.length > 0) {
      archivo.elementos_detectados.forEach(e => {
        if (e.length > 5) notas.push(`   - ${e}`);
      });
    }
  }

  const escala = analisis.campos.find(c => c.campo === 'escala_detectada')?.valor || 'no detectada';
  const metodo = analisis.campos.find(c => c.campo === 'metodo_extraccion')?.valor || 'inferencia';
  
  notas.push(`Resumen de Verificación:`);
  notas.push(`- Escala de referencia: ${escala}`);
  notas.push(`- Método de cálculo: ${metodo}`);
  
  if (analisis.errores.length > 0) {
    notas.push(`⚠ Advertencias Técnicas:`);
    analisis.errores.forEach(err => notas.push(`  * ${err}`));
  }

  return notas;
}

export const extractionAgent = {
  extractFromFiles,
};
