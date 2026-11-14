import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  logger.error(`[Error Handler]: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Request payload failed schema validation',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Custom Application Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details || [],
    });
  }

  // Catch-all Internal Server Error
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    details: isDev ? [{ stack: err.stack }] : [],
  });
}
