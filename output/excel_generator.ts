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

    // 4. HOJA: RUBROS POR ETAPA
    this.crearHojaRubros(wb, presupuesto);

    // 5. HOJA: LINKS DE COMPRA
    this.crearHojaLinks(wb, presupuesto);

    // 6. HOJA: MATERIALES (Desglose detallado)
    this.crearHojaMateriales(wb, presupuesto);

    // 6. HOJA: LOGÍSTICA
    this.crearHojaLogistica(wb, presupuesto);

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
        "Link de Compra", 
        "Confianza IA"
    ];

    const rows: any[] = [headers];
    
    p.items.forEach((i, idx) => {
      const rowNum = idx + 2;
      const row: any[] = [
        i.rubro,
        i.descripcion,
        i.cantidad,
        i.unidad,
        i.precio_unitario,
        i.subtotal,
        i.fuente_url || '', // Placeholder, se reemplaza con HYPERLINK
        i.confianza.toUpperCase()
      ];
      
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Agregar hipervínculos clicables para los links de compra
    p.items.forEach((i, idx) => {
      const cellRef = `G${idx + 2}`;
      if (i.fuente_url && i.fuente_url.startsWith('http')) {
        ws[cellRef] = {
          t: 's',
          v: i.fuente || 'Ver precio',
          l: { Target: i.fuente_url, Tooltip: `Comprar ${i.rubro}` }
        };
      } else if (i.fuente_url && i.fuente_url.includes('mercadolibre')) {
        ws[cellRef] = {
          t: 's',
          v: i.fuente || 'MercadoLibre',
          l: { Target: i.fuente_url, Tooltip: `Ver en MercadoLibre` }
        };
      } else if (i.fuente_url) {
        ws[cellRef] = {
          t: 's',
          v: i.fuente || 'Ver fuente',
          l: { Target: i.fuente_url, Tooltip: `Ir a la fuente` }
        };
      }
    });
    
    // Ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, { wch: 45 }, { wch: 10 }, { wch: 10 }, 
      { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 15 }
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

  private crearHojaRubros(wb: XLSX.WorkBook, p: Presupuesto) {
    const grupos: Record<string, ItemPresupuesto[]> = {};
    p.items.forEach(item => {
      const cat = item.categoria || "Otros";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(item);
    });

    const rows: any[] = [["RUBROS AGRUPADOS POR ETAPA"], [""]];
    rows.push(["Etapa", "Rubro", "Descripción Detallada", "Cantidad", "Unidad", "PU (USD)", "Subtotal"]);

    let granTotal = 0;

    Object.keys(grupos).sort().forEach(cat => {
      const items = grupos[cat];
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
      granTotal += subtotal;

      rows.push([cat, "", "", "", "", "", ""]);
      rows.push(["", "SUBTOTAL", "", "", "", "", subtotal]);
      rows.push([""])

      items.forEach(i => {
        rows.push([
          "",
          i.rubro,
          i.descripcion,
          i.cantidad,
          i.unidad,
          i.precio_unitario,
          i.subtotal
        ]);
      });
      rows.push([""]);
    });

    rows.push(["", "", "", "", "TOTAL OBRA:", "", granTotal]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 35 }, { wch: 25 }, { wch: 50 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "03-Rubros_Etapas");
  }

  private crearHojaMateriales(wb: XLSX.WorkBook, p: Presupuesto) {
    const desglose: Record<string, { especifico: string, cantidad: number, unidad: string }[]> = {};

    p.items.forEach(item => {
      const nombre = item.rubro.toLowerCase();
      let categoriaItem = "";

      if (nombre.includes("inodoro") || nombre.includes("bidet") || nombre.includes("bacha") ||
          nombre.includes("canilla") || nombre.includes("grif") || nombre.includes("ducha") ||
          nombre.includes("lavatorio") || nombre.includes("mingitorio")) {
        categoriaItem = "SANITARIOS";
      } else if (nombre.includes("ventana") || nombre.includes("puerta") || nombre.includes("abertura")) {
        categoriaItem = "ABERTURAS";
      } else if (nombre.includes("cable") || nombre.includes("toma") || nombre.includes("interruptor") ||
                 nombre.includes("luz") || nombre.includes("lampara")) {
        categoriaItem = "ELECTRICIDAD";
      } else if (nombre.includes("caño") || nombre.includes("tubo") || nombre.includes("agua") ||
                 nombre.includes("desague") || nombre.includes("cloaca")) {
        categoriaItem = "PLOMERÍA";
      } else if (nombre.includes("ladrillo") || nombre.includes("bloque") || nombre.includes("hormigon") ||
                 nombre.includes("cemento") || nombre.includes("arena") || nombre.includes("hierro")) {
        categoriaItem = "MATERIALES OBRA GRUESA";
      } else if (nombre.includes("pis") || nombre.includes("porcelanato") || nombre.includes("ceramico") ||
                 nombre.includes("zocal")) {
        categoriaItem = "PISOS";
      } else if (nombre.includes("pintura") || nombre.includes("revestimiento") || nombre.includes("venec")) {
        categoriaItem = "PINTURA Y REVESTIMIENTOS";
      } else {
        categoriaItem = "OTROS";
      }

      if (!desglose[categoriaItem]) desglose[categoriaItem] = [];
      desglose[categoriaItem].push({
        especifico: item.descripcion || item.rubro,
        cantidad: item.cantidad,
        unidad: item.unidad
      });
    });

    const rows: any[] = [["DESGLOSE DE MATERIALES Y ESPCIFICACIONES"], [""]];
    rows.push(["Categoría", "Descripción Específica", "Cantidad", "Unidad"]);

    let totalItems = 0;

    Object.keys(desglose).sort().forEach(cat => {
      const items = desglose[cat];
      rows.push([cat, "", "", ""]);
      items.forEach(i => {
        rows.push(["", i.especifico, i.cantidad, i.unidad]);
        totalItems += i.cantidad;
      });
      rows.push([""]);
    });

    rows.push(["", "TOTAL ÍTEMS:", totalItems, ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 15 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, ws, "04-Materiales");
  }

  private crearHojaLinks(wb: XLSX.WorkBook, p: Presupuesto) {
    const itemsConLinks = p.items.filter(i => i.fuente_url && i.fuente_url.startsWith('http'));
    
    if (itemsConLinks.length === 0) {
      const rows = [
        ["LINKS DE COMPRA - PROVEEDORES"],
        [""],
        ["No hay links de compra disponibles para este presupuesto."],
        [""],
        ["Los precios fueron obtenidos de fuentes generales."],
        ["Para buscar proveedores, visite:"],
        ["• MercadoLibre: https://www.mercadolibre.com.ar"],
        ["• Sodimac: https://www.sodimac.com.ar"],
        ["• Easy: https://www.easy.com.ar"],
        ["• Corralón: Consulte su proveedor local"]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws, "04-Links_Compra");
      return;
    }

    const rows: any[] = [
      ["LINKS DE COMPRA - PROVEEDORES DIRECTOS"],
      [""],
      ["Haga clic en los enlaces para ir directo a comprar los materiales"],
      [""]
    ];
    
    const headers = ["Rubro", "Precio Ref (USD)", "Link de Compra", "Fuente"];
    rows.push(headers);
    
    const grupos: Record<string, typeof itemsConLinks> = {};
    itemsConLinks.forEach(item => {
      const cat = item.categoria || "Otros";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(item);
    });
    
    Object.keys(grupos).sort().forEach(cat => {
      rows.push([cat, "", "", ""]);
      grupos[cat].forEach(i => {
        rows.push([
          `  ${i.rubro}`,
          i.precio_unitario,
          i.fuente_url || '',
          i.fuente || ''
        ]);
      });
      rows.push([""]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    itemsConLinks.forEach((i, idx) => {
      const rowIdx = 5 + idx;
      const cellRef = `C${rowIdx}`;
      if (i.fuente_url) {
        ws[cellRef] = {
          t: 's',
          v: i.fuente || 'Ir a comprar',
          l: { Target: i.fuente_url, Tooltip: `Comprar ${i.rubro}` }
        };
      }
    });
    
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 60 }, { wch: 30 }];
    
    XLSX.utils.book_append_sheet(wb, ws, "04-Links_Compra");
  }

  private crearHojaLogistica(wb: XLSX.WorkBook, p: Presupuesto) {
    const fleteItem = p.items.find(i => i.rubro.toLowerCase().includes("flete") || i.rubro.toLowerCase().includes("logistica"));
    const logisticaItem = p.items.find(i => i.rubro.toLowerCase().includes("movimiento") || i.rubro.toLowerCase().includes("excavacion"));

    const rows: any[] = [
      ["LOGÍSTICA Y MOVIMIENTO DE OBRA"],
      [""],
      ["CONCEPTO", "DETALLE", "VALOR (USD)"],
      ["", "", ""],
      ["TRANSPORTE Y FLETE", fleteItem ? fleteItem.descripcion : "A calcular según distancia", fleteItem ? fleteItem.subtotal : 0],
      ["MOVIMIENTO DE SUELOS", logisticaItem ? logisticaItem.descripcion : "No requerido", logisticaItem ? logisticaItem.subtotal : 0],
      ["", "", ""],
      ["RESUMEN LOGÍSTICA", "", (fleteItem?.subtotal || 0) + (logisticaItem?.subtotal || 0)],
      [""],
      ["OBSERVACIONES:", "", ""],
      ["- Los costos de flete varían según distancia a obra", "", ""],
      ["- Movimiento de suelos depende del tipo de terreno", "", ""],
      ["- Se recomienda verificar cubicaciones finales en obra", "", ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "05-Logistica");
  }
}

export const excelGenerator = new ExcelGenerator();