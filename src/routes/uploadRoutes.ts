import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { UploadValidator } from '../validators/uploadValidator';
import { AppError } from '../errors/AppError';
import { MeasurementService } from '../services/MeasurementService';

const router = Router();

type UploadRequest = {
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
  measure_datetime?: string;
  measure_type: 'WATER' | 'GAS';
};

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Endpoint para envio de imagens de medidores
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Envia imagem do medidor para análise
 *     description: |
 *       Recebe uma imagem em base64 e retorna:
 *       - URL temporária da imagem
 *       - Valor da medição
 *       - UUID da medição
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contents
 *               - customer_code
 *               - measure_type
 *             properties:
 *               contents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     parts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           inlineData:
 *                             type: object
 *                             properties:
 *                               mimeType:
 *                                 type: string
 *                               data:
 *                                 type: string
 *                           text:
 *                             type: string
 *               customer_code:
 *                 type: string
 *                 example: "cliente-1"
 *               measure_datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Data/hora da medição (ISO 8601)
 *                 example: "2024-05-20T14:30:00Z"
 *               measure_type:
 *                 type: string
 *                 enum: [WATER, GAS]
 *                 description: Tipo de medição
 *     responses:
 *       200:
 *         description: Medição processada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image_url:
 *                   type: string
 *                   example: "https://storage.example.com/550e8400.jpg"
 *                 measure_value:
 *                   type: number
 *                   example: 150
 *                 measure_uuid:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Leitura duplicada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "DOUBLE_REPORT"
 *                 error_description:
 *                   type: string
 *                   example: "Leitura do mês já realizada"
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  async (req: Request<{}, {}, UploadRequest>, res: Response, next: NextFunction) => {
    try {
      const { contents, customer_code, measure_datetime, measure_type } = req.body;

      const image = contents?.[0]?.parts?.find(p => p.inlineData?.data)?.inlineData?.data;

      if (!image) {
        throw new AppError('Imagem não fornecida', 'INVALID_IMAGE', 400);
      }

      UploadValidator.validateRequest({
        ...req.body,
        measure_datetime: req.body.measure_datetime || new Date().toISOString(),
      });

      const result = await MeasurementService.processUpload({
        image, // já é base64
        customer_code,
        measure_datetime: measure_datetime || new Date().toISOString(),
        measure_type
      });

      return res.status(200).json({
        image_url: result.imageUrl,
        measure_value: result.value,
        measure_uuid: result.uuid
      });

    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error_code: error.errorCode,
          error_description: error.message
        });
      }

      console.error('[ERROR] Erro durante o upload:', error);
      next(error);
    }
  }
);

export default router;
