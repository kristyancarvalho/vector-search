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
        message: `Não encontrei nenhuma informação sobre isso em meus dados.`,
        query
      });
    }
    
    if (results.length > 0) {
      try {
        const geminiAnalysis = await analyzeSearchResults(query, results);
        
        return res.json({
          message: geminiAnalysis.naturalResponse,
          query,
          relevantResults: geminiAnalysis.relevantResults,
          rawResults: results
        });
      } catch (geminiError: any) {
        console.warn('Erro na análise do Gemini, retornando resposta simplificada:', geminiError.message);
        
        const simplifiedResponse = `Com base nos dados fornecidos, encontrei estas informações: ${results.map(r => r.text).join('; ')}`;
        
        return res.json({
          message: simplifiedResponse,
          query,
          relevantResults: results.map(r => r.text)
        });
      }
    }
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