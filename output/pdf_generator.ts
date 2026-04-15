import { Presupuesto, PresupuestoComparativo, VersionPresupuesto } from "../blueprint/schema";
import { excelGenerator } from "./excel_generator";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = "./output";

export async function generarPDF(
  presupuesto: Presupuesto | any,
  obraNombre: string,
  comparativo?: PresupuestoComparativo,
  versiones?: VersionPresupuesto[]
): Promise<string> {
  console.log(`[PDF] Generando PDF para ${obraNombre}`);
  
  const usuarioId = presupuesto.usuario_id || 'general';
  const usuarioDir = path.join(OUTPUT_DIR, usuarioId);
  
  const timestamp = Date.now();
  const safeName = obraNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const filename = `${safeName}_${timestamp}.pdf`;
  const filepath = path.join(usuarioDir, filename);

  try {
    const excelHtml = await excelGenerator.generarExcel(presupuesto, obraNombre, comparativo, versiones);
    
    const htmlContent = fs.readFileSync(excelHtml, 'utf-8');
    const pdfHtml = htmlContent.replace('</html>', `
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        window.onload = function() {
          const element = document.body;
          const opt = {
            margin: 10,
            filename: '${obraNombre}_presupuesto.pdf',
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
