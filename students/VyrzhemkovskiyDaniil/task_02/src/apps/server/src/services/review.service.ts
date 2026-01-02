import { BookingStatus } from '@prisma/client';
import prisma from '../utils/prisma.util';
import { AppError } from '../middleware/error.middleware';
import {
  CreateReviewInput,
  UpdateReviewInput,
  GetReviewsQuery,
  ReviewResponse,
  ReviewsListResponse,
  ReviewStats,
} from '../types/review.types';

/**
 * Сервис для управления отзывами
 */
class ReviewService {
  /**
   * Получить список отзывов с фильтрацией
   */
  async getReviews(query: GetReviewsQuery): Promise<ReviewsListResponse> {
    const { venueId, userId, rating, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = query;

    // Построение фильтров
    const where: Record<string, unknown> = {};

    if (venueId) {
      where.venueId = venueId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (rating) {
      where.rating = rating;
    }

    // Подсчет общего количества
    const total = await prisma.review.count({ where });

    // Получение отзывов с пагинацией
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Расчет среднего рейтинга (если есть фильтр по площадке)
    let averageRating: number | undefined;
    if (venueId && total > 0) {
      const stats = await prisma.review.aggregate({
        where: { venueId },
        _avg: {
          rating: true,
        },
      });
      averageRating = stats._avg.rating || undefined;
    }

    // Форматирование ответа
    const formattedReviews: ReviewResponse[] = reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      venueId: review.venueId,
      user: review.user,
      venue: review.venue,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    return {
      reviews: formattedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      averageRating,
    };
  }

  /**
   * Получить отзыв по ID
   */
  async getReviewById(id: string): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError(404, 'NOT_FOUND', 'Review not found');
    }

    return {
      id: review.id,
      userId: review.userId,
      venueId: review.venueId,
      user: review.user,
      venue: review.venue,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  /**
   * Получить статистику отзывов для площадки
   */
  async getReviewStats(venueId: string): Promise<ReviewStats> {
    // Проверка существования площадки
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new AppError(404, 'NOT_FOUND', 'Venue not found');
    }

    // Общее количество отзывов
    const totalReviews = await prisma.review.count({
      where: { venueId },
    });

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    // Средний рейтинг
    const stats = await prisma.review.aggregate({
      where: { venueId },
      _avg: {
        rating: true,
      },
    });

    const averageRating = stats._avg.rating || 0;

    // Распределение рейтингов
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { venueId },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDistribution[item.rating as 1 | 2 | 3 | 4 | 5] = item._count.rating;
      }
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }

  /**
   * Создать новый отзыв
   */
  async createReview(data: CreateReviewInput, userId: string): Promise<ReviewResponse> {
    // Проверка существования площадки
    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
    });

    if (!venue) {
      throw new AppError(404, 'NOT_FOUND', 'Venue not found');
    }

    // Проверка: пользователь уже оставил отзыв на эту площадку
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        venueId: data.venueId,
      },
    });

    if (existingReview) {
      throw new AppError(409, 'DUPLICATE_REVIEW', 'You have already reviewed this venue. You can update your existing review.');
    }

    // Проверка: пользователь должен иметь хотя бы одно завершённое бронирование на этой площадке
    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: BookingStatus.COMPLETED,
        slot: {
          venueId: data.venueId,
        },
      },
    });

    if (!completedBooking) {
      throw new AppError(403, 'NO_COMPLETED_BOOKING', 'You must have a completed booking at this venue to leave a review');
    }

    // Создание отзыва
    const review = await prisma.review.create({
      data: {
        userId,
        venueId: data.venueId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return {
      id: review.id,
      userId: review.userId,
      venueId: review.venueId,
      user: review.user,
      venue: review.venue,
      rating: review.rating,
      comment: review.comment || undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  /**
   * Обновить отзыв
   */
  async updateReview(id: string, data: UpdateReviewInput, userId: string, isAdmin: boolean): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError(404, 'NOT_FOUND', 'Review not found');
    }

    // Проверка прав: только автор или админ
    if (!isAdmin && review.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only update your own reviews');
    }

    // Обновление отзыва
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return {
      id: updatedReview.id,
      userId: updatedReview.userId,
      venueId: updatedReview.venueId,
      user: updatedReview.user,
      venue: updatedReview.venue,
      rating: updatedReview.rating,
      comment: updatedReview.comment || undefined,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt,
    };
  }

  /**
   * Удалить отзыв
   */
  async deleteReview(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        venue: true,
      },
    });

    if (!review) {
      throw new AppError(404, 'NOT_FOUND', 'Review not found');
    }

    // Проверка прав: автор или админ
    if (!isAdmin && review.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own reviews');
    }

    // Удаление отзыва
    await prisma.review.delete({
      where: { id },
    });
  }
}

export default new ReviewService();
