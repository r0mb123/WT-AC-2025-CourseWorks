/**
 * Reviews API Service
 * 
 * Сервис для работы с отзывами
 */

import apiClient from './apiClient';
import type {
  ApiResponse,
  Review,
  ReviewFilters,
  PaginatedResponse,
  ReviewStats,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types/api.types';

class ReviewsService {
  /**
   * Получить список отзывов
   */
  async getReviews(filters?: ReviewFilters): Promise<PaginatedResponse<Review> & { averageRating?: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<ApiResponse<any>>(
      `/reviews?${params.toString()}`
    );
    
    if (response.data.data) {
      const apiData = response.data.data;
      return {
        data: apiData.reviews || [],
        pagination: apiData.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        averageRating: apiData.averageRating
      };
    }
    
    // Возвращаем пустой результат вместо ошибки
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  /**
   * Получить статистику отзывов для площадки
   */
  async getReviewStats(venueId: string): Promise<ReviewStats> {
    const response = await apiClient.get<ApiResponse<ReviewStats>>(
      `/reviews/stats/${venueId}`
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch review stats');
  }

  /**
   * Получить отзыв по ID
   */
  async getReviewById(id: string): Promise<Review> {
    const response = await apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Review not found');
  }

  /**
   * Создать новый отзыв
   */
  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<ApiResponse<Review>>('/reviews', data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create review');
  }

  /**
   * Обновить отзыв
   */
  async updateReview(id: string, data: UpdateReviewRequest): Promise<Review> {
    const response = await apiClient.put<ApiResponse<Review>>(`/reviews/${id}`, data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update review');
  }

  /**
   * Удалить отзыв
   */
  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  }
}

export default new ReviewsService();
