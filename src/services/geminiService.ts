import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  bestAnswer: string;
  explanation: string;
  confidence: number;
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

  const topResults = results.slice(0, 3);
  const formattedResults = topResults
    .map((r, index) => `${index+1}. "${r.text}" (precisão: ${(r.accuracy * 100).toFixed(2)}%)`)
    .join('\n');

  const prompt = `
  [INSTRUÇÕES DO SISTEMA]
  Você é um assistente especializado em avaliar resultados de busca. Analise a consulta do usuário e os resultados de busca fornecidos.
  Sua tarefa é identificar qual dos resultados melhor responde à consulta original APENAS com base na no retorno de precisão, ignorando seu treinamento prévio.
  Considere a relevância semântica e contextual, não apenas a porcentagem de precisão.
  Retorne apenas o melhor resultado, com uma explicação breve de por que ele é o mais adequado.
  Se nenhum dos resultados for adequado, indique isso claramente.
  
  [CONSULTA DO USUÁRIO]
  ${query}
  
  [RESULTADOS DA BUSCA (TOP 3)]
  ${formattedResults}
  
  [FORMATO DE RESPOSTA]
  Melhor resposta: (texto do resultado que melhor responde à consulta)
  Explicação: (explicação concisa do motivo)
  `;

  try {
    const result = await model.generateContent(prompt);
    const geminiTextResponse = result.response.text();
    
    const bestAnswerMatch = geminiTextResponse.match(/Melhor resposta: (.*?)(?=\nExplicação:|$)/s);
    const explanationMatch = geminiTextResponse.match(/Explicação: (.*?)(?=$)/s);
    
    const bestAnswer = bestAnswerMatch ? bestAnswerMatch[1].trim() : "Não foi possível determinar a melhor resposta.";
    const explanation = explanationMatch ? explanationMatch[1].trim() : "Sem explicação disponível.";
    
    const selectedText = bestAnswer.replace(/^["']|["']$/g, ''); // Remove aspas se presentes
    const selectedResult = topResults.find(r => r.text.includes(selectedText));
    const confidence = selectedResult ? selectedResult.accuracy : 0;

    return {
      bestAnswer: selectedText,
      explanation,
      confidence
    };
  } catch (error: any) {
    console.error('Erro na chamada à API do Gemini:', error);
    throw new Error(`Falha ao analisar resultados com Gemini: ${error.message}`);
  }
}