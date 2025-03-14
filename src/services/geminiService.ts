import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  naturalResponse: string;
  relevantResults: string[];
}

export async function analyzeSearchResults(
  query: string, 
  results: Array<{ text: string, accuracy: number }>
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não está definida nas variáveis de ambiente.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // * Carrega modelo de IA (Gemini 1.5 Flash)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const relevantResults = results.map(r => r.text);
  const formattedResults = results
    .map((r, index) => `${index+1}. "${r.text}" (precisão: ${(r.accuracy * 100).toFixed(2)}%)`)
    .join('\n');

  const prompt = `
  [INSTRUÇÕES DO SISTEMA]
  Você é um assistente especializado em responder buscas utilizando linguagem natural.
  Sua tarefa é formular uma resposta conversacional com base nos resultados da busca.
  NÃO analise qual é o melhor resultado nem explique os motivos da sua escolha.
  NÃO rejeite nenhum dos resultados como irrelevante.
  INCLUA TODOS os resultados na sua resposta de forma conversacional.
  
  [CONSULTA DO USUÁRIO]
  ${query}
  
  [RESULTADOS DA BUSCA]
  ${formattedResults}
  
  [FORMATO DE RESPOSTA]
  Com base nos dados fornecidos, é possível que [reformule a consulta de forma natural e inclua todos os resultados relevantes].
  Mantenha uma linguagem natural e conversacional, como se estivesse respondendo diretamente ao usuário.
  `;

  try {
    const result = await model.generateContent(prompt);
    const naturalResponse = result.response.text();
    
    return {
      naturalResponse,
      relevantResults
    };
  } catch (error: any) {
    console.error('Erro na chamada à API do Gemini:', error);
    throw new Error(`Falha ao analisar resultados com Gemini: ${error.message}`);
  }
}