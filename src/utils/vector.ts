export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must have the same length: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    console.warn("Warning: Zero vector detected in cosine similarity calculation");
    return 0;
  }

  const result = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, result));
}

export function testEmbedding(embedding: number[]): boolean {
  const hasInvalidValues = embedding.some(val => 
    typeof val !== 'number' || isNaN(val) || !isFinite(val)
  );

  const hasZeroVector = embedding.every(val => Math.abs(val) < 1e-10);

  if (hasInvalidValues) {
    console.error("Embedding contém valores inválidos");
    return false;
  }

  if (hasZeroVector) {
    console.error("Embedding é praticamente um vetor zero");
    return false;
  }

  return true;
}