import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';
import { logger } from '../utils/logger.util';

// Расширяем тип Request для хранения данных пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware для проверки JWT токена
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7); // Удаляем 'Bearer '

    try {
      const payload = verifyToken(token);
      req.user = payload;
      return next();
    } catch (error) {
      logger.warn('Invalid token attempt');
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Опциональная аутентификация (не требует токен, но если он есть - верифицирует)
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch (error) {
    // Игнорируем ошибки валидации для опциональной аутентификации
    logger.debug('Optional auth: Invalid token');
  }

  return next();
}
