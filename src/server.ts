import express, { Request, Response } from 'express';
import { initializeEmbeddings, searchSimilarDocuments } from './services/searchService';

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
    
    // * Precisão mínima em 48%
    const threshold = 0.48;
    const results = await searchSimilarDocuments(query, threshold);
    
    const allResults = await searchSimilarDocuments(query, 0);
    
    if (results.length === 0) {
      return res.json({
        message: `Não encontrei resultados relevantes com precisão acima de ${threshold * 100}%.`,
        results: [],
        allResults: allResults.slice(0, 5)
      });
    }
    
    return res.json({
      message: "Resultados encontrados com base na sua pergunta.",
      results,
      query
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
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar embeddings:', error);
    process.exit(1);
  }
};

startServer().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});