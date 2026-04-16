import { getRangoHistoricoDesdeRAG } from './agents/research_agent';

async function test() {
  console.log('Probando RAG range para ladrillo');
  const rango = await getRangoHistoricoDesdeRAG('ladrillo');
  console.log('Rango:', rango);
  
  console.log('Probando RAG range para cemento');
  const rango2 = await getRangoHistoricoDesdeRAG('cemento');
  console.log('Rango:', rango2);
}

test().catch(console.error);