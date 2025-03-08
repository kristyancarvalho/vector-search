import { pipeline } from '@xenova/transformers';

let embeddingModel: any = null;

export async function getEmbeddingModel() {
  if (embeddingModel) {
    return embeddingModel;
  }

  // * Carrega o modelo de embedding (all-MiniLM-L6-v2)
  console.log('Carregando modelo de embeddings...');
  embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Modelo de embeddings carregado!');
  return embeddingModel;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbeddingModel();
  
  const result = await model(text, { pooling: 'mean', normalize: true });
  
  return Array.from(result.data);
}