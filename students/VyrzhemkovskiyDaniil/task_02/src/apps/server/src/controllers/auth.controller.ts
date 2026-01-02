import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger.util';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   * Регистрация нового пользователя
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      logger.info(`New user registered: ${result.user.email}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User successfully registered',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Вход пользователя
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      logger.info(`User logged in: ${result.user.email}`);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Получение текущего пользователя
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
      }

      const user = await authService.getCurrentUser(req.user.userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Обновление профиля пользователя
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
      }

      const user = await authService.updateProfile(req.user.userId, req.body);

      logger.info(`Profile updated: ${user.email}`);

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Profile successfully updated',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /api/auth/password
   * Смена пароля пользователя
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
      }

      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      logger.info(`Password changed for user: ${req.user.userId}`);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Password successfully changed',
      });
    } catch (error) {
      return next(error);
    }
  }
}
