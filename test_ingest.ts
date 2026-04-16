import { ingest } from './rag/ingest';

console.log('Ingestando obras históricas...');
const result = ingest.ingestObras();
console.log(`Resultado: ${result.procesadas} procesadas, ${result.errores} errores`);

// Verificar que se hayan cargado
import { vectorStore } from './rag/store';
async function check() {
  const obras = await vectorStore.getObras();
  console.log(`Obras en vector store: ${obras.length}`);
  if (obras.length > 0) {
    console.log('Primera obra:', obras[0].nombre);
    console.log('Ratios:', obras[0].ratios);
  }
}
check();