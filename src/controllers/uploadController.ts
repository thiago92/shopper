import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { MeasureRow } from '../types/database';

const uploadSchema = z.object({
  image: z.string().regex(/^data:image\/(png|jpeg);base64,/),
  customer_code: z.string().min(3),
  measure_datetime: z.string().datetime(),
  measure_type: z.enum(['WATER', 'GAS'])
});

export const uploadHandler = async (req: Request, res: Response) => {
  try {
    const validated = uploadSchema.parse(req.body);
    
    // Verifica se já existe medida no mês
    const [rows] = await pool.query<MeasureRow[]>(
        `SELECT * FROM measures 
         WHERE customer_code = ? AND measure_type = ? 
         AND MONTH(measure_datetime) = MONTH(?) 
         AND YEAR(measure_datetime) = YEAR(?)`,
        [validated.customer_code, validated.measure_type, 
         validated.measure_datetime, validated.measure_datetime]
    );

    if (rows.length > 0) {
      return res.status(409).json({
        error_code: "DOUBLE_REPORT",
        error_description: "Leitura do mês já realizada"
      });
    }

    // Processa imagem com Gemini
    const value = await GeminiService.analyzeImage(validated.image);
    
    // Salva no banco
    const measure_uuid = uuidv4();
    const image_url = `https://storage.example.com/${measure_uuid}.jpg`;

    await pool.query(
      `INSERT INTO measures 
       (measure_uuid, customer_code, measure_datetime, measure_type, initial_value, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [measure_uuid, validated.customer_code, validated.measure_datetime, 
       validated.measure_type, value, image_url]
    );

    res.status(200).json({
      image_url,
      measure_value: value,
      measure_uuid
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: error.errors
      });
    }
    
    res.status(500).json({
      error_code: "INTERNAL_ERROR",
      error_description: message
    });
  }
};