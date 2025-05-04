import { AppError } from '../errors/AppError';

export class UploadValidator {
  static validateRequest(data: {
    image: string;
    customer_code: string;
    measure_datetime: string;
    measure_type: string;
  }): void {
    // 1. Validação de campos obrigatórios
    if (!data.image || !data.customer_code || !data.measure_datetime || !data.measure_type) {
      throw new AppError('MISSING_FIELDS', 'Todos os campos são obrigatórios', 400);
    }

    // 2. Validação do Base64 (aceita com ou sem prefixo)
    this.validateBase64(data.image);

    // 3. Validação do tipo
    if (!['WATER', 'GAS'].includes(data.measure_type)) {
      throw new AppError('INVALID_MEASURE_TYPE', 'Tipo deve ser WATER ou GAS', 400);
    }
  }

  private static validateBase64(image: string): void {
    // Extrai o Base64 puro (remove prefixo se existir)
    const base64Data = image.startsWith('data:image/') 
      ? image.split(',')[1]?.trim() || image
      : image;

    // Validação do formato Base64
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
      throw new AppError('INVALID_BASE64', 'Formato Base64 inválido', 400);
    }

    // Verifica tamanho mínimo
    if (base64Data.length < 4) {
      throw new AppError('INVALID_BASE64', 'Base64 muito curto', 400);
    }
  }
}