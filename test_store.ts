import { vectorStore } from './rag/store';

async function test() {
  const obras = await vectorStore.getObras();
  console.log('Obras en store:', obras.length);
  console.log(obras);
}
test();