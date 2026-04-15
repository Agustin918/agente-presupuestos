import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { orchestrator } from '../agents/orchestrator';
import { validarBlueprint } from '../blueprint/validator';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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