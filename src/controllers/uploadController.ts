import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { MeasureRow } from '../types/database';
import { AppError } from '../errors/AppError';

const uploadSchema = z.object({
  contents: z.array(
    z.object({
      parts: z.array(
        z.object({
          inlineData: z.object({
            mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
            data: z.string().min(100, "Base64 deve ter pelo menos 100 caracteres")
          }).optional(),
          text: z.string().optional()
        })
      ).min(1, "Cada content deve ter pelo menos uma parte")
    })
  ).min(1, "Pelo menos um content deve ser fornecido"),
  customer_code: z.string()
    .min(3, "Código do cliente deve ter pelo menos 3 caracteres")
    .max(50, "Código do cliente deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9\-_]+$/, "Código do cliente contém caracteres inválidos"),
  measure_datetime: z.string().datetime({ message: "Formato de data/hora inválido" }),
  measure_type: z.enum(['WATER', 'GAS'])
});

export const uploadHandler = async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validação do payload
    const validated = uploadSchema.parse(req.body);
    console.log('Payload validado:', JSON.stringify(validated, null, 2));

    // 2. Extração e validação da imagem
    const firstContent = validated.contents[0];
    const imagePart = firstContent.parts.find(part => part.inlineData?.data);

    if (!imagePart || !imagePart.inlineData) {
      throw new AppError('MISSING_IMAGE', 'Nenhuma parte com imagem encontrada no content', 400);
    }

    // 3. Verificação de duplicidade
    const [existingMeasures] = await conn.query<MeasureRow[]>(
      `SELECT measure_uuid FROM measures 
       WHERE customer_code = ? 
       AND measure_type = ? 
       AND DATE_FORMAT(measure_datetime, '%Y-%m') = DATE_FORMAT(?, '%Y-%m') 
       LIMIT 1`,
      [validated.customer_code, validated.measure_type, validated.measure_datetime]
    );

    if (existingMeasures.length > 0) {
      throw new AppError(
        'DUPLICATE_MEASURE',
        `Já existe uma medição registrada para o cliente ${validated.customer_code} neste mês`,
        409,
        { existing_measure_uuid: existingMeasures[0].measure_uuid }
      );
    }

    // 4. Processamento da imagem
    console.log('Iniciando processamento da imagem...');
    const measurementValue = await GeminiService.analyzeImage({
      mimeType: imagePart.inlineData.mimeType,
      data: imagePart.inlineData.data
    });
    console.log('Valor obtido:', measurementValue);

    // 5. Persistência dos dados
    const measure_uuid = uuidv4();
    const fileExtension = imagePart.inlineData.mimeType.split('/')[1];
    const image_url = `https://storage.example.com/${measure_uuid}.${fileExtension}`;

    await conn.query(
      `INSERT INTO measures (
        measure_uuid, 
        customer_code, 
        measure_datetime, 
        measure_type, 
        initial_value, 
        image_url, 
        is_confirmed,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        measure_uuid,
        validated.customer_code,
        validated.measure_datetime,
        validated.measure_type,
        measurementValue,
        image_url
      ]
    );

    await conn.commit();

    // 6. Resposta de sucesso
    res.status(201).json({
      success: true,
      data: {
        measure: {
          uuid: measure_uuid,
          type: validated.measure_type,
          value: measurementValue,
          datetime: validated.measure_datetime,
          customer_code: validated.customer_code
        },
        image_url,
        verification: {
          required: true,
          status: 'pending'
        }
      }
    });

  } catch (error) {
    await conn.rollback();

    console.error('Erro no uploadHandler:', {
      error: error instanceof Error ? error.stack : error,
      requestBody: req.body
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error_code: "VALIDATION_ERROR",
        error_description: "Dados de entrada inválidos",
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error_code: error.errorCode,
        error_description: error.message,
        ...(error.details && { details: error.details })
      });
    }

    res.status(500).json({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Ocorreu um erro inesperado no processamento"
    });
  } finally {
    conn.release();
  }
};
