import { Presupuesto, PresupuestoComparativo, ItemPresupuesto, VersionPresupuesto } from "../blueprint/schema";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import { formatCurrency } from "../utils/currency";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = "./output";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateHtml(
  presupuesto: Presupuesto,
  comparativo?: PresupuestoComparativo
): string {
  const vencimiento = new Date();
  vencimiento.setDate(vencimiento.getDate() + PRECIO_VIGENCIA_DIAS);

  // Agrupar items
  const grupos: Record<string, ItemPresupuesto[]> = {};
  presupuesto.items.forEach(item => {
    const cat = item.categoria || "Otros";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(item);
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Presupuesto: ${presupuesto.obra}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #2d3748; background: #fff; line-height: 1.5; }
    .page-header { border-bottom: 2px solid #1a3a5f; padding-bottom: 20px; margin-bottom: 40px; }
    .studio-name { font-size: 1.4rem; font-weight: 700; color: #1a3a5f; letter-spacing: 1px; text-transform: uppercase; }
    .doc-type { font-size: 0.85rem; color: #718096; margin-top: 5px; }
    h1 { font-size: 2.2rem; font-weight: 300; color: #1a3a5f; margin: 30px 0 10px 0; }
    .project-meta { font-size: 0.9rem; color: #4a5568; margin-bottom: 40px; display: flex; justify-content: space-between; }
    
    .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .card { padding: 20px; border-radius: 4px; border: 1px solid #e2e8f0; }
    .card-total { background: #1a3a5f; color: white; border: none; }
    .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; opacity: 0.8; }
    .value { font-size: 1.8rem; font-weight: 700; }
    
    .qa-section { background: #f7fafc; padding: 20px; border-radius: 4px; border-left: 4px solid #3182ce; margin-bottom: 40px; }
    .qa-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; color: #2c5282; display: flex; align-items: center; }
    .qa-list { margin: 0; padding-left: 20px; font-size: 0.85rem; color: #4a5568; }

    .category-group { margin-bottom: 50px; page-break-inside: avoid; }
    .category-header { border-bottom: 1px solid #1a3a5f; padding: 10px 0; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .category-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #1a3a5f; }
    .category-subtotal { font-size: 0.95rem; font-weight: 600; color: #4a5568; }
    
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 0.7rem; color: #a0aec0; text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
    td { padding: 15px 0; border-bottom: 1px solid #f7fafc; font-size: 0.85rem; }
    .item-rubro { font-weight: 600; color: #2d3748; }
    .item-desc { color: #718096; font-size: 0.75rem; margin-top: 3px; }
    .item-price { text-align: right; font-weight: 600; }
    .item-reasoning { font-size: 0.65rem; color: #a0aec0; font-style: italic; margin-top: 2px; }
    
    .footer { margin-top: 60px; font-size: 0.75rem; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="studio-name">Estudio de Arquitectura</div>
    <div class="doc-type">Memoria Presupuestaria y Técnica • Informe IA v3.0</div>
  </div>

  <h1>${presupuesto.obra}</h1>
  <div class="project-meta">
    <span><strong>ID:</strong> ${presupuesto.id || 'N/A'}</span>
    <span><strong>Fecha:</strong> ${presupuesto.fecha}</span>
    <span><strong>Ubicación:</strong> ${presupuesto.obra.split(' - ')[1] || 'Argentina'}</span>
  </div>

  <div class="dashboard">
    <div class="card card-total">
      <span class="label">Inversión Total Estimada (${presupuesto.divisa})</span>
      <div class="value">${formatCurrency(presupuesto.total_estimado, presupuesto.divisa)}</div>
    </div>
    <div class="card">
      <span class="label">Valor por Metro Cuadrado</span>
      <div class="value" style="color: #1a3a5f;">${formatCurrency(presupuesto.costo_m2, presupuesto.divisa)}<span style="font-size: 0.8rem; font-weight: 400; margin-left: 5px;">/m²</span></div>
    </div>
    <div class="card">
      <span class="label">Superficie Total</span>
      <div class="value" style="font-size: 1.4rem;">${presupuesto.superficie_m2} <span style="font-size: 0.7rem;">m²</span></div>
    </div>
    <div class="card">
      <span class="label">Configuración Técnica</span>
      <div style="font-size: 0.85rem;"><strong>Sistema:</strong> ${presupuesto.estructura}</div>
      <div style="font-size: 0.85rem;"><strong>Nivel:</strong> ${presupuesto.categoria}</div>
    </div>
  </div>

  ${presupuesto.reporte_qa ? `
    <div class="qa-section">
      <div class="qa-title">Informe de Auditoría Técnica (${presupuesto.reporte_qa.status.toUpperCase()})</div>
      <ul class="qa-list">
        ${presupuesto.reporte_qa.alerta_roja.map(a => `<li><strong>Alerta:</strong> ${a}</li>`).join('')}
        ${presupuesto.reporte_qa.sugerencias.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
`;

  // Sort by category index
  Object.keys(grupos).sort().forEach(cat => {
    const items = grupos[cat];
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    
    html += `
    <div class="category-group">
      <div class="category-header">
        <h3>${cat}</h3>
        <span class="category-subtotal">${formatCurrency(subtotal, presupuesto.divisa)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%">Rubro</th>
            <th style="width: 50%">Especificación</th>
            <th style="width: 10%">Cant.</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach(i => {
      html += `
        <tr>
          <td><div class="item-rubro">${i.rubro}</div></td>
          <td>
            <div class="item-desc">${i.descripcion}</div>
            ${i.razonamiento_ia ? `<div class="item-reasoning">Nota IA: ${i.razonamiento_ia}</div>` : ''}
          </td>
          <td>${i.cantidad} ${i.unidad}</td>
          <td class="item-price">${formatCurrency(i.subtotal, presupuesto.divisa)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    </div>
    `;
  });

  html += `
  <div class="footer">
    <p>Documento emitido por Agente de Presupuestos IA. Los valores son referenciales y sujetos a variaciones del mercado.</p>
    <p>Vigencia de precios estimada: ${vencimiento.toLocaleDateString("es-AR")}</p>
  </div>
</body>
</html>`;

  return html;
}

export async function generarPDF(
  presupuesto: Presupuesto,
  obraNombre: string,
  comparativo?: PresupuestoComparativo,
  versiones?: VersionPresupuesto[]
): Promise<string> {
  ensureDir(OUTPUT_DIR);
  const usuarioId = (presupuesto as any).usuario_id || 'general';
  const usuarioDir = path.join(OUTPUT_DIR, usuarioId);
  ensureDir(usuarioDir);

  const timestamp = Date.now();
  const safeName = obraNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const filename = `${safeName}_${timestamp}.pdf`;
  const filepath = path.join(usuarioDir, filename);

  try {
    const htmlContent = generateHtml(presupuesto, comparativo);
    
    const pdfHtml = htmlContent.replace('</html>', `
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        window.onload = function() {
          const element = document.body;
          const opt = {
            margin: 10,
            filename: '${obraNombre}_Presupuesto.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(element).save();
        };
      </script>
    </body></html>`);
    
    const htmlPath = filepath.replace('.pdf', '_preview.html');
    fs.writeFileSync(htmlPath, pdfHtml);
    
    return htmlPath;
  } catch (error) {
    console.error('[PDF] Error generando:', error);
    return filepath;
  }
}

export const pdfGenerator = {
  generarPDF,
};

