import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../config/geminiConfig';
import { AppError } from '../errors/AppError';
import { Part } from '@google/generative-ai';

export class GeminiService {
  private static genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

  static async analyzeImage(imageData: {
    mimeType: string;
    data: string;
  }): Promise<number> {
    try {
      console.log('[GeminiService] Iniciando análise de imagem');
      
      const { pureBase64, mimeType } = this.validateAndPrepareImage(imageData);
      console.log('[GeminiService] Imagem validada - Tipo:', mimeType);

      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        }
      });

      const prompt = `Esta é uma imagem de um medidor de água/gás. 
      Analise cuidadosamente os dígitos mostrados no visor.
      Retorne APENAS o valor numérico da medição, sem unidades ou texto adicional.
      Formato esperado: 1234.56
      Valor:`;

      console.log('[GeminiService] Preparando payload para Gemini');
      
      // ESTRUTURA CORRETA com tipagem TypeScript
      const parts: Part[] = [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: pureBase64
          }
        }
      ];

      console.log('[GeminiService] Enviando para API Gemini...');
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }]
      });
      
      const responseText = result.response.text();
      console.log('[GeminiService] Resposta recebida:', responseText);

      const measurement = this.parseMeasurement(responseText);
      this.validateMeasurementRange(measurement); // Nova validação de range
      
      return measurement;
    } catch (error) {
      console.error('[Erro] GeminiService:', error);
      throw this.handleGeminiError(error);
    }
  }

  private static validateAndPrepareImage(imageData: {
    mimeType: string;
    data: string;
  }): { pureBase64: string, mimeType: string } {
      // 1. Validação inicial
      if (!imageData || !imageData.data || typeof imageData.data !== 'string') {
          console.error('[Validação] Dados da imagem não fornecidos ou formato inválido');
          throw new AppError('INVALID_IMAGE', 'Nenhuma imagem fornecida', 400);
      }
  
      // 2. Extração do Base64 puro (remove prefixo se existir)
      const base64String = imageData.data;
      const [prefix, base64Data] = base64String.split(',');
      let pureBase64 = base64Data?.trim() || base64String.trim();
  
      // 3. Limpeza do Base64
      pureBase64 = pureBase64.replace(/[^A-Za-z0-9+/=]/g, '');
  
      // 4. Validações do Base64
      if (pureBase64.length < 100) {
          console.error('[Validação] Base64 muito curto:', pureBase64.length);
          throw new AppError('INVALID_IMAGE', 'Imagem muito pequena para análise', 400);
      }
  
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(pureBase64)) {
          console.error('[Validação] Formato Base64 inválido');
          throw new AppError('INVALID_IMAGE', 'Formato Base64 inválido', 400);
      }
  
      // 5. Correção de padding
      pureBase64 = this.fixBase64Padding(pureBase64);
  
      // 6. Validação final com decodificação
      try {
          const buffer = Buffer.from(pureBase64, 'base64');
          if (buffer.length < 100) {
              throw new Error('Imagem decodificada muito pequena');
          }
      } catch (e) {
          console.error('[Validação] Falha na decodificação:', e.message);
          throw new AppError('INVALID_IMAGE', 'Dados da imagem inválidos', 400);
      }
  
      // 7. Determinação do MIME type (usa o fornecido ou detecta do prefixo)
      let mimeType = imageData.mimeType || 'image/jpeg';
      if (prefix && !mimeType) {
          if (prefix.includes('image/png')) mimeType = 'image/png';
          else if (prefix.includes('image/jpeg')) mimeType = 'image/jpeg';
          else if (prefix.includes('image/webp')) mimeType = 'image/webp';
          else if (prefix.includes('image/gif')) mimeType = 'image/gif';
      }
  
      console.log('[Validação] Imagem validada - Tipo:', mimeType, 'Tamanho:', pureBase64.length);
      return { pureBase64, mimeType };
  }

  private static fixBase64Padding(base64: string): string {
    const padLength = (4 - (base64.length % 4)) % 4;
    return base64 + '='.repeat(padLength);
  }

  private static parseMeasurement(text: string): number {
    // Extrai números, pontos e vírgulas
    const numericValue = text.replace(/[^\d.,]/g, '')
                           .replace(',', '.')
                           .replace(/\.(?=.*\.)/g, '');

    const value = parseFloat(numericValue);
    if (isNaN(value)) {
      throw new AppError(
        'INVALID_MEASURE_VALUE',
        `Não foi possível interpretar o valor. Resposta: "${text}"`,
        400
      );
    }
    return value;
  }

  // Nova função para validar o range da medição
  private static validateMeasurementRange(value: number): void {
    // Valores razoáveis para medidores (ajuste conforme sua necessidade)
    const MIN_VALUE = 0;
    const MAX_VALUE = 99999;
    
    if (value < MIN_VALUE || value > MAX_VALUE) {
      throw new AppError(
        'INVALID_MEASURE_RANGE',
        `O valor ${value} está fora do intervalo aceitável (${MIN_VALUE}-${MAX_VALUE})`,
        400
      );
    }
  }

  // Função para registrar erros detalhadamente
  private static logError(error: unknown, context: string = ''): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    console.error('[Erro Detalhado]', JSON.stringify(errorInfo, null, 2));
  }

  private static handleGeminiError(error: unknown): AppError {
    this.logError(error, 'handleGeminiError');
    
    if (error instanceof AppError) return error;
    
    // Tratamento específico para erros da API Gemini
    if (error instanceof Error && error.message.includes('400')) {
      return new AppError('INVALID_IMAGE', 'A imagem fornecida é inválida ou não pôde ser processada', 400);
    }
    
    if (error instanceof Error && error.message.includes('429')) {
      return new AppError('RATE_LIMIT_EXCEEDED', 'Limite de requisições excedido, tente novamente mais tarde', 429);
    }
    
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new AppError('GEMINI_CONNECTION_ERROR', message, 503);
  }
}