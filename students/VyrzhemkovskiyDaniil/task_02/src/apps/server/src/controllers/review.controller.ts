import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  GetReviewsQuerySchema,
} from '../types/review.types';
import { AuthRequest } from '../types/auth.types';

/**
 * Контроллер для управления отзывами
 */
class ReviewController {
  /**
   * Получить список отзывов
   * GET /api/reviews
   */
  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = GetReviewsQuerySchema.parse(req.query);
      const result = await reviewService.getReviews(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получить отзыв по ID
   * GET /api/reviews/:id
   */
  async getReviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const review = await reviewService.getReviewById(id);

      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получить статистику отзывов для площадки
   * GET /api/reviews/stats/:venueId
   */
  async getReviewStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venueId } = req.params;
      const stats = await reviewService.getReviewStats(venueId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создать новый отзыв
   * POST /api/reviews
   */
  async createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateReviewSchema.parse(req.body);
      const userId = req.user!.userId;

      const review = await reviewService.createReview(data, userId);

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновить отзыв
   * PUT /api/reviews/:id
   */
  async updateReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateReviewSchema.parse(req.body);
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';

      const review = await reviewService.updateReview(id, data, userId, isAdmin);

      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удалить отзыв
   * DELETE /api/reviews/:id
   */
  async deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';

      await reviewService.deleteReview(id, userId, isAdmin);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
