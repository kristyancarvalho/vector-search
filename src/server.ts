import express, { Request, Response } from 'express';
import { initializeEmbeddings, searchSimilarDocuments } from './services/searchService';
import { analyzeSearchResults } from './services/geminiService';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.post('/search', async (req: Request, res: Response): Promise<any> => {
  try {
    const { query } = req.body;
    console.log('Requisição recebida:', req.body);
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'A consulta é obrigatória e deve ser uma string' 
      });
    }
    
    const threshold = 0.5;
    const results = await searchSimilarDocuments(query, threshold);
    
    if (results.length === 0) {
      return res.json({
        message: `Não encontrei resultados relevantes para sua pergunta.`,
        query,
        results: []
      });
    }
    
    if (results.length > 0) {
      try {
        const geminiAnalysis = await analyzeSearchResults(query, results);
        
        return res.json({
          message: "Resultados analisados com IA.",
          query,
          bestAnswer: geminiAnalysis.bestAnswer,
          explanation: geminiAnalysis.explanation,
          confidence: geminiAnalysis.confidence,
          rawResults: results
        });
      } catch (geminiError: any) {
        console.warn('Erro na análise do Gemini, retornando resultados brutos:', geminiError.message);
        return res.json({
          message: "Resultados encontrados com base na sua pergunta (sem análise IA).",
          query,
          results,
          error: geminiError.message
        });
      }
    }
    
    return res.json({
      message: "Resultados encontrados com base na sua pergunta.",
      query,
      results
    });
  } catch (error: any) {
    console.error('Erro na busca:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar a busca',
      details: error.message 
    });
  }
});

const startServer = async () => {
  try {
    await initializeEmbeddings();
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ AVISO: GEMINI_API_KEY não está definida! A análise avançada de resultados não funcionará.');
    } else {
      console.log('✅ Integração com Gemini API configurada.');
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar embeddings:', error);
    process.exit(1);
  }
};

startServer().catch(err => {
  console.error('❌ Erro ao iniciar o servidor:', err);
  process.exit(1);
});