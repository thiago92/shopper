// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Tratamento de erros de validação do Zod (para POST /upload)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: fromZodError(err).toString() // Formata os erros do Zod em string
    });
  }

  // 2. Tratamento para erros de negócio específicos
  if (typeof err === 'object' && err !== null && 'error_code' in err) {
    const businessError = err as { error_code: string; error_description?: string };
    return res.status(getStatusCode(businessError.error_code)).json({
      error_code: businessError.error_code,
      error_description: businessError.error_description || 'Erro de negócio'
    });
  }

  // 3. Tratamento genérico para erros inesperados
  console.error('[Error Handler]', err);
  res.status(500).json({
    error_code: 'INTERNAL_ERROR',
    error_description: 'Ocorreu um erro interno no servidor'
  });
};

// Helper para mapear error_code para status HTTP
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'INVALID_DATA': 400,
    'MEASURE_NOT_FOUND': 404,
    'DOUBLE_REPORT': 409,
    'CONFIRMATION_DUPLICATE': 409
  };
  return statusMap[errorCode] || 500;
}