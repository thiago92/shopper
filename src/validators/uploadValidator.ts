import { AppError } from '../errors/AppError';

export class UploadValidator {
  private static readonly MAX_BASE64_LENGTH = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_BASE64_LENGTH = 100;

  static validateRequest(data: {
    contents: Array<{
      parts: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
        text?: string;
      }>;
    }>;
    customer_code: string;
    measure_datetime: string;
    measure_type: string;
  }): void {
    try {
      // 1. Validação de campos obrigatórios
      this.validateRequiredFields(data);
      
      // 2. Validação da estrutura de contents/parts
      this.validateContents(data.contents);
      
      // 3. Validação do tipo de medição
      this.validateMeasureType(data.measure_type);
      
      // 4. Validação do código do cliente
      this.validateCustomerCode(data.customer_code);
      
      // 5. Validação da data/hora
      this.validateMeasureDateTime(data.measure_datetime);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'VALIDATION_ERROR', 
        `Erro durante a validação: ${error instanceof Error ? error.message : String(error)}`,
        400
      );
    }
  }

  private static validateRequiredFields(data: any): void {
    const missingFields = [];
    
    if (!data.contents || !Array.isArray(data.contents) || data.contents.length === 0) {
      missingFields.push('contents');
    }
    if (!data.customer_code?.trim()) missingFields.push('customer_code');
    if (!data.measure_datetime?.trim()) missingFields.push('measure_datetime');
    if (!data.measure_type?.trim()) missingFields.push('measure_type');

    if (missingFields.length > 0) {
      throw new AppError(
        'MISSING_FIELDS',
        `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        400
      );
    }
  }

  private static validateContents(contents: Array<any>): void {
    if (contents.length === 0) {
      throw new AppError('INVALID_CONTENTS', 'Contents não pode ser vazio', 400);
    }

    for (const content of contents) {
      if (!content.parts || !Array.isArray(content.parts)) {
        throw new AppError('INVALID_PARTS', 'Cada content deve ter um array parts', 400);
      }

      let hasImage = false;
      for (const part of content.parts) {
        if (part.inlineData) {
          hasImage = true;
          this.validateInlineData(part.inlineData);
        }
      }

      if (!hasImage) {
        throw new AppError('MISSING_IMAGE', 'Pelo menos uma parte deve conter inlineData com imagem', 400);
      }
    }
  }

  private static validateInlineData(inlineData: {
    mimeType: string;
    data: string;
  }): void {
    // Valida mimeType
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(inlineData.mimeType)) {
      throw new AppError(
        'INVALID_MIME_TYPE',
        `Tipo de imagem não suportado. Use: ${validMimeTypes.join(', ')}`,
        400
      );
    }

    // Valida base64
    this.validateBase64(inlineData.data);
  }

  private static validateBase64(base64Data: string): void {
    // 1. Verifica se é string
    if (typeof base64Data !== 'string') {
      throw new AppError('INVALID_BASE64', 'Os dados da imagem devem ser uma string Base64', 400);
    }

    // 2. Limpa possíveis prefixos
    const pureBase64 = base64Data.split(',')[1]?.trim() || base64Data.trim();

    // 3. Verifica tamanho
    if (pureBase64.length < this.MIN_BASE64_LENGTH) {
      throw new AppError(
        'INVALID_BASE64', 
        `Base64 muito curto (mínimo ${this.MIN_BASE64_LENGTH} caracteres)`, 
        400
      );
    }

    if (pureBase64.length > this.MAX_BASE64_LENGTH) {
      throw new AppError(
        'INVALID_BASE64', 
        `Base64 muito longo (máximo ${this.MAX_BASE64_LENGTH} caracteres)`, 
        400
      );
    }

    // 4. Valida formato Base64
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(pureBase64)) {
      throw new AppError('INVALID_BASE64', 'Formato Base64 inválido', 400);
    }
  }

  private static validateMeasureType(measureType: string): void {
    const validMeasureTypes = ['GAS', 'WATER'];
    if (!validMeasureTypes.includes(measureType)) {
      throw new AppError(
        'INVALID_MEASURE_TYPE',
        `Tipo de medição inválido. Use: ${validMeasureTypes.join(', ')}`,
        400
      );
    }
  }

  private static validateCustomerCode(customerCode: string): void {
    if (!/^[A-Za-z0-9_-]+$/.test(customerCode)) {
      throw new AppError(
        'INVALID_CUSTOMER_CODE',
        'O código do cliente contém caracteres inválidos',
        400
      );
    }
  }

  private static validateMeasureDateTime(measureDateTime: string): void {
    // Valida se a data/hora está no formato ISO 8601
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(measureDateTime)) {
      throw new AppError(
        'INVALID_MEASURE_DATETIME',
        'A data/hora da medição deve estar no formato ISO 8601',
        400
      );
    }
  }

  // ... (mantenha os métodos validateCustomerCode e validateMeasureDateTime como estão)
}