import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../config/geminiConfig';
import { AppError } from '../errors/AppError';
import { Part } from '@google/generative-ai';

export class GeminiService {
  private static genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

  static async analyzeImage(imageBase64: string): Promise<number> {
    try {
      console.log('[GeminiService] Iniciando análise de imagem');
      
      const { pureBase64, mimeType } = this.validateAndPrepareImage(imageBase64);
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

      return this.parseMeasurement(responseText);
    } catch (error) {
      console.error('[Erro] GeminiService:', error);
      throw this.handleGeminiError(error);
    }
  }

  private static validateAndPrepareImage(imageBase64: string): { pureBase64: string, mimeType: string } {
    // 1. Validação inicial
    if (!imageBase64 || typeof imageBase64 !== 'string') {
        console.error('[Validação] Imagem não fornecida ou formato inválido');
        throw new AppError('INVALID_IMAGE', 'Nenhuma imagem fornecida', 400);
    }

    // 2. Extração do Base64 puro
    const [prefix, base64Data] = imageBase64.split(',');
    let pureBase64 = base64Data?.trim() || imageBase64.trim();

    // 3. Limpeza do Base64
    pureBase64 = pureBase64.replace(/[^A-Za-z0-9+/=]/g, '');

    // 4. Validações do Base64
    if (pureBase64.length < 100) { // Ajuste este valor conforme necessário
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
        if (buffer.length < 100) { // Verificação mínima de tamanho da imagem
            throw new Error('Imagem decodificada muito pequena');
        }
    } catch (e) {
        console.error('[Validação] Falha na decodificação:', e.message);
        throw new AppError('INVALID_IMAGE', 'Dados da imagem inválidos', 400);
    }

    // 7. Determinação do MIME type
    let mimeType = 'image/jpeg'; // Padrão
    if (prefix) {
        if (prefix.includes('image/png')) mimeType = 'image/png';
        else if (prefix.includes('image/jpeg')) mimeType = 'image/jpeg';
        else if (prefix.includes('image/webp')) mimeType = 'image/webp';
    }

    console.log('[Validação] Imagem validada - Tipo:', mimeType, 'Tamanho:', pureBase64.length);
    return { pureBase64, mimeType };
}

private static fixBase64Padding(base64: string): string {
    const padLength = (4 - (base64.length % 4)) % 4;
    return base64 + '='.repeat(padLength);
}

  private static parseMeasurement(text: string): number {
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

  private static serializeError(error: unknown): string {
    if (error instanceof Error) {
      return JSON.stringify({ message: error.message, stack: error.stack });
    }
    return JSON.stringify(error);
  }

  private static handleGeminiError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new AppError('GEMINI_CONNECTION_ERROR', message, 503);
  }
}