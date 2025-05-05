import { Request, Response } from 'express';
import { MeasureRepository } from '../repositories/MeasureRepository';
import { AppError } from '../errors/AppError';
import { z } from 'zod';
import pool from '../config/database';

const confirmSchema = z.object({
  measure_uuid: z.string().uuid({
    message: "UUID inválido"
  }),
  confirmed_value: z.number().positive({
    message: "O valor confirmado deve ser positivo"
  }),
  confirmed_by: z.string().min(3, {
    message: "Nome do confirmador deve ter pelo menos 3 caracteres"
  })
});

export const confirmHandler = async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { measure_uuid, confirmed_value, confirmed_by } = confirmSchema.parse(req.body);

    await conn.beginTransaction();

    // 1. Verifica se a medida existe
    const measure = await MeasureRepository.findByUuid(measure_uuid, conn);
    if (!measure) {
      throw new AppError('MEASURE_NOT_FOUND', 'Leitura não encontrada', 404);
    }

    // 2. Verifica se já foi confirmada
    if (measure.is_confirmed) {
      throw new AppError('MEASURE_ALREADY_CONFIRMED', 'Leitura já confirmada', 409);
    }

    // 3. Validação adicional do valor
    if (confirmed_value < measure.initial_value * 0.9 || 
        confirmed_value > measure.initial_value * 1.1) {
      throw new AppError(
        'VALUE_OUT_OF_RANGE',
        'Valor confirmado difere muito do valor inicial (acima de 10%)',
        400
      );
    }

    // 4. Atualiza no banco
    await MeasureRepository.confirmMeasure(
      measure_uuid, 
      confirmed_value, 
      confirmed_by,
      conn
    );

    await conn.commit();
    
    res.status(200).json({ 
      success: true,
      data: {
        measure_uuid,
        previous_value: measure.initial_value,
        confirmed_value,
        confirmation_date: new Date().toISOString()
      }
    });

  } catch (error) {
    await conn.rollback();
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error_code: "VALIDATION_ERROR",
        error_description: error.errors.map(e => e.message).join(', ')
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error_code: error.errorCode,
        error_description: error.message
      });
    }

    console.error('Erro inesperado:', error);
    res.status(500).json({
      error_code: "INTERNAL_ERROR",
      error_description: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    conn.release();
  }
};