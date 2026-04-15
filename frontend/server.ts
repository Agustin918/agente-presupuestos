import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { orchestrator } from '../agents/orchestrator';
import { validarBlueprint } from '../blueprint/validator';
import { getPreciosComparados } from '../agents/price_compare_agent';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

const HISTORIAL_FILE = path.join(__dirname, '..', 'data', 'historial.json');

function loadHistorial(): any[] {
    try {
        if (fs.existsSync(HISTORIAL_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORIAL_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error cargando historial:', e);
    }
    return [];
}

function saveHistorial(historial: any[]) {
    try {
        const dir = path.dirname(HISTORIAL_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(historial, null, 2));
    } catch (e) {
        console.error('Error guardando historial:', e);
    }
}

// Endpoint para obtener el schema del blueprint (para UI dinámica)
app.get('/api/blueprint/schema', (req, res) => {
  // Devolver información sobre los campos del blueprint
  const schemaInfo = {
    campos: [
      { nombre: 'id', tipo: 'string', descripcion: 'ID único generado automáticamente', requerido: true },
      { nombre: 'usuario_id', tipo: 'string', descripcion: 'ID del usuario', requerido: true },
      { nombre: 'estudio_id', tipo: 'string', descripcion: 'ID del estudio', requerido: true },
      { nombre: 'fecha_creacion', tipo: 'date', descripcion: 'Fecha de creación (YYYY-MM-DD)', requerido: true },
      { nombre: 'nombre_obra', tipo: 'string', descripcion: 'Nombre del proyecto', requerido: true },
      { nombre: 'ubicacion', tipo: 'string', descripcion: 'Ciudad, provincia', requerido: true },
      { nombre: 'superficie_cubierta_m2', tipo: 'number', descripcion: 'Superficie cubierta en m²', requerido: true },
      { nombre: 'superficie_semicubierta_m2', tipo: 'number', descripcion: 'Superficie semicubierta en m²', requerido: false },
      { nombre: 'plantas', tipo: 'number', descripcion: 'Cantidad de plantas (1, 2, 3)', requerido: true },
      { nombre: 'tiene_planos', tipo: 'select', opciones: ['aprobados', 'anteproyecto', 'sin_planos'], requerido: true },
      { nombre: 'dormitorios', tipo: 'number', descripcion: 'Cantidad de dormitorios', requerido: true },
      { nombre: 'cantidad_banos', tipo: 'number', descripcion: 'Cantidad de baños', requerido: true },
      { nombre: 'tiene_cochera', tipo: 'boolean', requerido: true },
      { nombre: 'tipo_cochera', tipo: 'select', opciones: ['cubierta', 'semicubierta', 'descubierta'], requerido: false },
      { nombre: 'tiene_quincho', tipo: 'boolean', requerido: true },
      { nombre: 'tiene_galeria', tipo: 'boolean', requerido: true },
      { nombre: 'tiene_deck', tipo: 'boolean', requerido: true },
      { nombre: 'superficie_deck_m2', tipo: 'number', requerido: false },
      { nombre: 'cocina_equipada', tipo: 'boolean', requerido: true },
      { nombre: 'estructura', tipo: 'select', opciones: ['albanileria', 'steel_frame', 'hormigon_armado', 'madera', 'mixto'], requerido: true },
      { nombre: 'cubierta', tipo: 'select', opciones: ['chapa_acanalada', 'chapa_trapezoidal', 'membrana_losa', 'teja_ceramica', 'techo_verde'], requerido: true },
      { nombre: 'tiene_escalera', tipo: 'boolean', requerido: true },
      { nombre: 'categoria', tipo: 'select', opciones: ['economico', 'estandar', 'premium', 'lujo'], requerido: true },
      { nombre: 'factor_terminacion', tipo: 'number', descripcion: 'Factor de terminación (1.0, 1.35, 1.8, 2.5)', requerido: true },
      { nombre: 'pisos', tipo: 'select', opciones: ['ceramico', 'porcelanato', 'madera', 'microcemento', 'a_definir'], requerido: true },
      { nombre: 'cielorraso', tipo: 'select', opciones: ['suspendido', 'placas', 'a_definir'], requerido: true },
      { nombre: 'aberturas', tipo: 'select', opciones: ['aluminio_dvh', 'aluminio_basico', 'pvc', 'madera'], requerido: true },
      { nombre: 'revestimiento_exterior', tipo: 'select', opciones: ['revoque_fino', 'piedra', 'madera', 'a_definir'], requerido: true },
      { nombre: 'porton_cerco', tipo: 'boolean', requerido: true },
      { nombre: 'material_cerco', tipo: 'select', opciones: ['metalico', 'madera', 'hormigon', 'a_definir'], requerido: false },
      { nombre: 'instalaciones', tipo: 'multiselect', opciones: ['electrica', 'sanitaria', 'gas', 'calefaccion_radiante', 'aire_acondicionado', 'domotica', 'paneles_solares', 'pileta'], requerido: true },
      { nombre: 'calentador_agua', tipo: 'select', opciones: ['termotanque_gas', 'termotanque_electrico', 'calefon', 'a_definir'], requerido: true },
      { nombre: 'tiene_cisterna', tipo: 'boolean', requerido: true },
      { nombre: 'tiene_tanque_elevado', tipo: 'boolean', requerido: true },
      { nombre: 'terreno_tipo', tipo: 'select', opciones: ['lote_propio', 'barrio_cerrado', 'country', 'ph', 'otro'], requerido: true },
      { nombre: 'terreno_zona_inundable', tipo: 'boolean', requerido: true },
      { nombre: 'plazo_meses', tipo: 'number', descripcion: 'Plazo estimado en meses', requerido: true },
      { nombre: 'modalidad', tipo: 'select', opciones: ['llave_en_mano', 'administracion', 'solo_materiales'], requerido: true },
    ]
  };
  res.json(schemaInfo);
});

// Endpoint para validar un blueprint
app.post('/api/blueprint/validate', (req, res) => {
  try {
    const blueprint = req.body;
    const validation = validarBlueprint(blueprint);
    res.json(validation);
  } catch (error) {
    res.status(400).json({ error: 'Error validando blueprint', detalles: (error as any).message });
  }
});

// Endpoint para generar presupuesto
app.post('/api/presupuesto/generar', async (req, res) => {
  try {
    const { blueprint, archivos } = req.body;
    
    // Validar blueprint
    const validation = validarBlueprint(blueprint);
    if (!validation.valido) {
      return res.status(400).json({ error: 'Blueprint inválido', errores: validation.errores });
    }

    console.log(`Generando presupuesto para: ${blueprint.nombre_obra}`);
    
    // Llamar al orquestador
    const resultado = await orchestrator.runWithFiles(archivos || [], blueprint);
    
    if (resultado.exito) {
      // Guardar en historial
      const historial = loadHistorial();
      const entrada = {
        id: blueprint.id,
        nombre_obra: blueprint.nombre_obra,
        fecha: new Date().toISOString().split('T')[0],
        superficie_m2: blueprint.superficie_cubierta_m2,
        total_estimado: resultado.presupuesto?.total_estimado,
        estructura: blueprint.estructura,
        categoria: blueprint.categoria,
        ubicacion: blueprint.ubicacion,
        blueprint: blueprint,
        presupuesto: resultado.presupuesto
      };
      historial.unshift(entrada);
      // Mantener solo los últimos 50
      saveHistorial(historial.slice(0, 50));
      
      res.json({
        exito: true,
        presupuesto: resultado.presupuesto,
        version: resultado.version,
        mensaje: 'Presupuesto generado exitosamente'
      });
    } else {
      res.status(500).json({
        exito: false,
        errores: resultado.errores,
        mensaje: 'Error generando presupuesto'
      });
    }
  } catch (error) {
    console.error('Error generando presupuesto:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalles: (error as any).message });
  }
});

// Endpoint para obtener historial de presupuestos
app.get('/api/presupuestos', (req, res) => {
  try {
    const historial = loadHistorial();
    res.json({ presupuestos: historial });
  } catch (error) {
    res.status(500).json({ error: 'Error leyendo historial' });
  }
});

// Endpoint para obtener un presupuesto específico
app.get('/api/presupuestos/:id', (req, res) => {
  try {
    const historial = loadHistorial();
    const presupuesto = historial.find((p: any) => p.id === req.params.id);
    if (presupuesto) {
      res.json(presupuesto);
    } else {
      res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error leyendo presupuesto' });
  }
});

// ============ UPLOAD DE ARCHIVOS ============

// Endpoint para subir múltiples archivos
app.post('/api/upload', upload.array('archivos', 20), async (req: any, res: any) => {
  try {
    const archivos = req.files as any[];
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron archivos' });
    }

    const archivosInfo = archivos.map((file: any) => ({
      id: file.filename.split('-')[0],
      nombre: file.originalname,
      nombreGuardado: file.filename,
      tamano: file.size,
      tipo: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase(),
      ruta: file.path,
    }));

    console.log(`[Upload] ${archivos.length} archivos subidos`);
    
    res.json({ 
      success: true, 
      archivos: archivosInfo,
      mensaje: `${archivos.length} archivo(s) subido(s) correctamente`
    });
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({ success: false, error: 'Error subiendo archivos' });
  }
});

// Endpoint para subir archivos como base64 (más compatible con frontend)
app.post('/api/upload/base64', async (req: any, res: any) => {
  try {
    const { archivos } = req.body as { archivos: Array<{ nombre: string; data: string; tipo: string }> };
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron archivos' });
    }

    const archivosInfo: any[] = [];

    for (const archivo of archivos) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(archivo.nombre);
      const filename = `${uniqueSuffix}-${archivo.nombre.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Decodificar base64 y guardar
      const buffer = Buffer.from(archivo.data, 'base64');
      fs.writeFileSync(filepath, buffer);

      archivosInfo.push({
        id: uniqueSuffix.toString(),
        nombre: archivo.nombre,
        nombreGuardado: filename,
        tamano: buffer.length,
        tipo: archivo.tipo,
        extension: ext.toLowerCase(),
        ruta: filepath,
      });
    }

    console.log(`[Upload] ${archivos.length} archivos subidos (base64)`);
    
    res.json({ 
      success: true, 
      archivos: archivosInfo,
      mensaje: `${archivos.length} archivo(s) subido(s) correctamente`
    });
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({ success: false, error: 'Error subiendo archivos' });
  }
});

// Endpoint para procesar archivos y extraer datos (usando Extraction Agent)
app.post('/api/upload/procesar', async (req: any, res: any) => {
  try {
    const { archivos, blueprint } = req.body;
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron archivos para procesar' });
    }

    console.log(`[Upload] Procesando ${archivos.length} archivos...`);

    // Llamar al extraction agent con las rutas de archivos
    const { extractionAgent } = require('../agents/extraction_agent');
    const rutasArchivos = archivos.map((a: any) => a.ruta);
    const extraccion = await extractionAgent.extractFromFiles(rutasArchivos);

    // Combinar con blueprint existente si existe
    const blueprintFinal = {
      ...blueprint,
      ...extraccion.blueprint_parcial,
      archivos_fuente: archivos.map((a: any) => a.nombre),
      confianza_extraccion: extraccion.confianza,
    };

    res.json({
      success: true,
      blueprint: blueprintFinal,
      extraccion: {
        campos_extraidos: Object.keys(extraccion.blueprint_parcial).length,
        confianza: extraccion.confianza,
        archivos_procesados: extraccion.archivos_procesados,
        notas: extraccion.notas_extraccion,
      }
    });
  } catch (error) {
    console.error('Error procesando archivos:', error);
    res.status(500).json({ success: false, error: 'Error procesando archivos' });
  }
});

// Endpoint para eliminar archivo
app.delete('/api/upload/:id', (req, res) => {
  try {
    const { id } = req.params;
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(id + '-'));
    
    if (file) {
      fs.unlinkSync(path.join(UPLOAD_DIR, file));
      res.json({ success: true, mensaje: 'Archivo eliminado' });
    } else {
      res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error eliminando archivo' });
  }
});

// Endpoint para listar archivos subidos
app.get('/api/upload', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const archivos = files.map(f => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, f));
      return {
        nombre: f.substring(f.indexOf('-', f.indexOf('-') + 1) + 1),
        nombreGuardado: f,
        tamano: stats.size,
        fecha: stats.mtime,
      };
    });
    res.json({ success: true, archivos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error listando archivos' });
  }
});

// Endpoint para comparar precios en múltiples fuentes
app.get('/api/precios/comparar', async (req, res) => {
  try {
    const materiales = (req.query.materiales as string)?.split(',') || ['ladrillo', 'cemento', 'arena'];
    
    console.log(`[API] Comparando precios para: ${materiales.join(', ')}`);
    
    const precios = await getPreciosComparados(materiales);
    
    res.json({ success: true, precios });
  } catch (error) {
    console.error('Error comparando precios:', error);
    res.status(500).json({ success: false, error: 'Error comparando precios' });
  }
});

// Endpoint para descargar Excel
app.post('/api/presupuesto/descargar/excel', async (req, res) => {
  try {
    const { presupuesto } = req.body;
    const excelGenerator = require('../output/excel_generator');
    const filePath = await excelGenerator.generarExcel(presupuesto, presupuesto.obra);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${presupuesto.obra.replace(/\s+/g, '_')}_presupuesto.xlsx"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: 'Error generando Excel' });
  }
});

// Endpoint para descargar PDF
app.post('/api/presupuesto/descargar/pdf', async (req, res) => {
  try {
    const { presupuesto } = req.body;
    const pdfGenerator = require('../output/pdf_generator');
    const filePath = await pdfGenerator.generarPDF(presupuesto, presupuesto.obra);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${presupuesto.obra.replace(/\s+/g, '_')}_presupuesto.pdf"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// Servir el HTML principal para cualquier otra ruta
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor frontend escuchando en http://localhost:${PORT}`);
  console.log(`Formulario disponible en http://localhost:${PORT}`);
});