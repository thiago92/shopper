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
  })
});

export const confirmHandler = async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { measure_uuid, confirmed_value } = confirmSchema.parse(req.body);

    await conn.beginTransaction();

    // 1. Verifica se a medida existe
    const measure = await MeasureRepository.findByUuid(measure_uuid, conn);
    if (!measure) {
      throw new AppError('MEASURE_NOT_FOUND', 'Leitura não encontrada', 404);
    }

    // 2. Verifica se já foi confirmada
    if (measure.is_confirmed) {
      throw new AppError('CONFIRMATION_DUPLICATE', 'Leitura já confirmada', 409);
    }

    // 3. Atualiza no banco
    await MeasureRepository.confirmMeasure(measure_uuid, confirmed_value, conn);

    await conn.commit();
    res.status(200).json({ success: true });

  } catch (error) {
    await conn.rollback();
    
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    
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
      error_description: message
    });
  } finally {
    conn.release();
  }
};