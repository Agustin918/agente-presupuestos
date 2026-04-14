import { Presupuesto, PresupuestoComparativo, ItemPresupuesto, VersionPresupuesto } from "../blueprint/schema";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = "./output";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

function getConfianzaColor(confianza: "alta" | "media" | "baja"): string {
  switch (confianza) {
    case "alta": return "#d4edda"; // verde claro
    case "media": return "#fff3cd"; // amarillo claro
    case "baja": return "#f8d7da"; // rojo claro
    default: return "#ffffff";
  }
}

function generateHtml(
  presupuesto: Presupuesto,
  comparativo?: PresupuestoComparativo,
  versiones?: VersionPresupuesto[]
): string {
  const vencimiento = new Date();
  vencimiento.setDate(vencimiento.getDate() + PRECIO_VIGENCIA_DIAS);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Presupuesto: ${presupuesto.obra}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
    .resumen { background: #f5f5f5; padding: 20px; margin-bottom: 30px; }
    .resumen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #333; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .confianza-alta { background-color: #d4edda; }
    .confianza-media { background-color: #fff3cd; }
    .confianza-baja { background-color: #f8d7da; }
    .precio-desactualizado { color: #e74c3c; font-weight: bold; }
    .comparativo { margin-top: 40px; }
    .vencimiento { margin-top: 30px; color: #666; font-size: 14px; }
    .version-cambio { background-color: #e9ecef; padding: 5px; margin: 2px 0; }
  </style>
</head>
<body>
  <h1>${presupuesto.obra}</h1>
  <div class="resumen">
    <div class="resumen-grid">
      <div><strong>Fecha:</strong> ${presupuesto.fecha}</div>
      <div><strong>Superficie:</strong> ${presupuesto.superficie_m2} m²</div>
      <div><strong>Estructura:</strong> ${presupuesto.estructura}</div>
      <div><strong>Categoría:</strong> ${presupuesto.categoria}</div>
      <div><strong>Factor:</strong> ${presupuesto.factor_terminacion}x</div>
      <div><strong>Total:</strong> ${formatCurrency(presupuesto.total_estimado)}</div>
    </div>
    <div style="margin-top: 15px;">
      <strong>Precios:</strong> ${presupuesto.precios_frescos} frescos, ${presupuesto.precios_cache} del cache
    </div>
    <div style="margin-top: 10px;">
      <strong>Confianza general:</strong> Alta: ${presupuesto.items.filter(i => i.confianza === "alta").length}, 
      Media: ${presupuesto.items.filter(i => i.confianza === "media").length}, 
      Baja: ${presupuesto.items.filter(i => i.confianza === "baja").length}
    </div>
  </div>

  <h2>Detalle por Rubro</h2>
  <table>
    <thead>
      <tr>
        <th>Rubro</th>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Unidad</th>
        <th>Precio Unit.</th>
        <th>Subtotal</th>
        <th>Confianza</th>
        <th>Fuente</th>
      </tr>
    </thead>
    <tbody>
`;

  for (const item of presupuesto.items) {
    const confianzaClass = `confianza-${item.confianza}`;
    const desactualizado = item.precio_desactualizado ? " precio-desactualizado" : "";
    const nota = item.nota_confianza ? `<br><small>${item.nota_confianza}</small>` : "";
    
    html += `
      <tr class="${confianzaClass}">
        <td>${item.rubro}</td>
        <td>${item.descripcion}</td>
        <td>${item.cantidad}</td>
        <td>${item.unidad}</td>
        <td class="${desactualizado}">${formatCurrency(item.precio_unitario)}</td>
        <td>${formatCurrency(item.subtotal)}</td>
        <td>${item.confianza.toUpperCase()}${nota}</td>
        <td>${item.fuente}<br><small>${item.fecha_precio}</small></td>
      </tr>`;
  }

  html += `
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5"><strong>Total Estimado</strong></td>
        <td colspan="3"><strong>${formatCurrency(presupuesto.total_estimado)}</strong></td>
      </tr>
    </tfoot>
  </table>
`;

  if (comparativo) {
    html += `
  <div class="comparativo">
    <h2>Comparativo por Categoría</h2>
    <table>
      <thead>
        <tr>
          <th>Categoría</th>
          <th>Factor</th>
          <th>Total</th>
          <th>Diferencia vs Económico</th>
          <th>Items que más cambian</th>
        </tr>
      </thead>
      <tbody>
`;

    for (const esc of comparativo.escenarios) {
      html += `
        <tr>
          <td>${esc.categoria}</td>
          <td>${esc.factor}x</td>
          <td>${formatCurrency(esc.total_estimado)}</td>
          <td>${esc.diferencia_vs_economico}</td>
          <td>${esc.items_que_mas_cambian.join(", ")}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>`;
  }

  if (versiones && versiones.length > 1) {
    html += `
  <div class="comparativo">
    <h2>Historial de Versiones</h2>
    <table>
      <thead>
        <tr>
          <th>Versión</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Resumen de Cambios</th>
        </tr>
      </thead>
      <tbody>
`;

    for (const ver of versiones) {
      html += `
        <tr>
          <td>${ver.version}</td>
          <td>${ver.fecha}</td>
          <td>${formatCurrency(ver.total)}</td>
          <td>${ver.resumen_cambios || "Sin cambios"}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>`;
  }

  html += `
  <div class="vencimiento">
    <p>Precio válido hasta: ${vencimiento.toLocaleDateString("es-AR")}</p>
    <p><strong>Nota:</strong> Los rubros en color verde tienen alta confianza, amarillo media confianza, rojo baja confianza.</p>
  </div>
</body>
</html>`;

  return html;
}

export async function generarExcel(
  presupuesto: Presupuesto,
  usuarioId: string,
  comparativo?: PresupuestoComparativo,
  versiones?: VersionPresupuesto[]
): Promise<string> {
  ensureDir(OUTPUT_DIR);
  const usuarioDir = path.join(OUTPUT_DIR, usuarioId);
  ensureDir(usuarioDir);

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const filename = `${presupuesto.obra.replace(/\s+/g, "_")}_${timestamp}.html`;
  const filepath = path.join(usuarioDir, filename);

  const html = generateHtml(presupuesto, comparativo, versiones);
  fs.writeFileSync(filepath, html, "utf-8");

  console.log(`[Excel] Generado: ${filepath}`);
  return filepath;
}

export const excelGenerator = {
  generarExcel,
};