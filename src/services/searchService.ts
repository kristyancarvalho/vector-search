import { generateEmbedding } from './embeddingService';
import { cosineSimilarity } from '../utils/vector';

const documents = [
  "O gato está no telhado",
  "O cachorro late para a lua",
  "Os pássaros cantam ao amanhecer",
  "O telhado tem um gato preto",
  "O melhor notebook gamer é o ideapad Gaming 3i",
  "A rússia é um país composto por ursos pardos antrópicos que vivem em uma sociedade utópica.",
];

interface DocumentWithEmbedding {
  text: string;
  embedding: number[];
}

let documentEmbeddings: DocumentWithEmbedding[] = [];

export async function initializeEmbeddings() {
  console.log('Inicializando embeddings para documentos...');
  documentEmbeddings = [];
  
  for (const doc of documents) {
    const embedding = await generateEmbedding(doc);
    documentEmbeddings.push({ text: doc, embedding });
  }
  
  console.log('Embeddings inicializados para', documentEmbeddings.length, 'documentos');
}

export async function searchSimilarDocuments(query: string, minAccuracy: number = 0.7): Promise<{ text: string, accuracy: number }[]> {
  console.log(`Realizando busca para: "${query}" com precisão mínima de ${minAccuracy}`);
  
  const queryEmbedding = await generateEmbedding(query);
  
  const results = documentEmbeddings.map(doc => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    return {
      text: doc.text,
      accuracy: similarity
    };
  });
  
  console.log('Resultados da busca (todos):', 
    results.map(r => ({ texto: r.text, precisão: r.accuracy.toFixed(4) }))
  );
  
  const filteredResults = results
    .filter(result => result.accuracy >= minAccuracy)
    .sort((a, b) => b.accuracy - a.accuracy);
  
  console.log(`Resultados filtrados (>=${minAccuracy}):`, 
    filteredResults.map(r => ({ texto: r.text, precisão: r.accuracy.toFixed(4) }))
  );
  
  return filteredResults;
}