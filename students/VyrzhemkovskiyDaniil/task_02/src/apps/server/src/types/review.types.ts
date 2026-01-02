import { z } from 'zod';

/**
 * Схема для создания отзыва
 */
export const CreateReviewSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID format'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment cannot exceed 1000 characters').optional(),
});

/**
 * Схема для обновления отзыва
 */
export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment cannot exceed 1000 characters').optional(),
}).refine(
  (data) => data.rating !== undefined || data.comment !== undefined,
  {
    message: 'At least one field (rating or comment) must be provided',
  }
);

/**
 * Схема для фильтрации отзывов
 */
export const GetReviewsQuerySchema = z.object({
  venueId: z.string().uuid('Invalid venue ID format').optional(),
  userId: z.string().uuid('Invalid user ID format').optional(),
  rating: z.string().regex(/^[1-5]$/).transform(Number).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  sortBy: z.enum(['rating', 'createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Типы для TypeScript
 */
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;

/**
 * Тип для ответа с отзывом
 */
export interface ReviewResponse {
  id: string;
  userId: string;
  venueId: string;
  user?: {
    id: string;
    name: string;
  };
  venue?: {
    id: string;
    name: string;
    type: string;
  };
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Тип для списка отзывов с пагинацией
 */
export interface ReviewsListResponse {
  reviews: ReviewResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  averageRating?: number;
}

/**
 * Тип для статистики отзывов
 */
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
