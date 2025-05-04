import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { setupSwagger } from './config/swagger';
import uploadRoutes from './routes/uploadRoutes';

// 1. Configuração inicial
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app: Application = express();
const PORT: number = Number(process.env.PORT) || 80;

// 2. Middlewares básicos
app.use(cors());
app.use(express.json());

// 3. Swagger
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// 4. Rotas
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP',
    message: 'API Shopper operacional',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  const docsLink = process.env.NODE_ENV !== 'production' 
    ? `<li><a href="/api-docs">Documentação da API</a></li>`
    : '';
  
  res.send(`
    <h1>API Shopper</h1>
    <p>Endpoint disponível:</p>
    <ul>
      ${docsLink}
      <li><strong>POST /upload</strong> - Envio de imagens para medição</li>
    </ul>
  `);
});

// 5. Rota principal
app.use('/upload', uploadRoutes);

// 6. Tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Erro]', err.message);
  res.status(500).json({
    error_code: 'INTERNAL_ERROR',
    error_description: 'Erro no servidor'
  });
});

// 7. Inicialização
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor rodando na porta ${PORT}
  📌 Endpoint: POST http://localhost:${PORT}/upload
  📚 Docs: http://localhost:${PORT}/api-docs
  `);
});