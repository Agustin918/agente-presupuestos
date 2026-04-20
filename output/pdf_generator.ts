import { Presupuesto, PresupuestoComparativo, ItemPresupuesto, VersionPresupuesto } from "../blueprint/schema";
import { PRECIO_VIGENCIA_DIAS } from "../config/settings";
import { formatCurrency } from "../utils/currency";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 50px; color: #000000; background: #fff; line-height: 1.6; }
    .page-header { border-bottom: 2px solid #000000; padding-bottom: 30px; margin-bottom: 50px; display: flex; justify-content: space-between; align-items: center; }
    .studio-name { font-size: 1.6rem; font-weight: 800; color: #000000; letter-spacing: -1px; text-transform: uppercase; }
    .studio-name span { font-weight: 300; }
    .doc-type { font-size: 0.75rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    
    h1 { font-size: 3rem; font-weight: 200; color: #000000; margin: 0 0 10px 0; letter-spacing: -2px; }
    .project-meta { font-size: 0.85rem; color: #475569; margin-bottom: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    
    .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 50px; }
    .card { padding: 25px; border-radius: 8px; background: #ffffff; border: 1px solid #e2e8f0; }
    .card-total { background: #000000; color: white; border: none; grid-column: span 1; }
    .label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: block; color: inherit; opacity: 0.7; font-weight: 700; }
    .value { font-size: 1.8rem; font-weight: 800; letter-spacing: -1px; }
    
    .category-group { margin-bottom: 60px; page-break-inside: avoid; }
    .category-header { background: #000000; padding: 12px 20px; margin-bottom: 0; border-radius: 4px 4px 0 0; }
    .category-header h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }
    
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th { text-align: left; font-size: 0.65rem; color: #475569; text-transform: uppercase; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 20px; border-bottom: 1px solid #f8fafc; font-size: 0.85rem; vertical-align: top; }
    .item-rubro { font-weight: 700; color: #000000; font-size: 0.95rem; }
    .item-desc { color: #475569; font-size: 0.75rem; margin-top: 5px; max-width: 400px; }
    .item-price { text-align: right; font-weight: 800; color: #000000; font-size: 1rem; }
    .item-reasoning { font-size: 0.65rem; color: #94a3b8; font-style: italic; margin-top: 8px; border-left: 2px solid #e2e8f0; padding-left: 10px; }
    
    .footer { margin-top: 100px; padding-top: 30px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="studio-name">AGUSTÍN<span>STUDIO</span></div>
    <div class="doc-type">Libro de Obra Inteligente • Reporte Técnico v9.0</div>
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
    
    // Crear archivo HTML temporal
    const tempHtmlPath = filepath.replace('.pdf', '_temp.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    console.log(`[PDF] Renderizando documento técnico nativo para: ${obraNombre}...`);
    
    // Renderizado Headless con Playwright para asegurar PDF real
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const uri = `file:///${path.resolve(tempHtmlPath).replace(/\\/g, '/')}`;
    await page.goto(uri, { waitUntil: 'networkidle' });
    
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    
    await browser.close();
    
    // Limpieza
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    
    console.log(`[PDF] Libro de Obra (PDF) listo: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('[PDF] Error generando documento nativo:', error);
    return filepath;
  }
}

export const pdfGenerator = {
  generarPDF,
};

