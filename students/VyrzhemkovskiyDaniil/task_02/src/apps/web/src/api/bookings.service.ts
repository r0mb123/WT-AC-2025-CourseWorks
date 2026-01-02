/**
 * Bookings API Service
 * 
 * Сервис для работы с бронированиями
 */

import apiClient from './apiClient';
import type {
  ApiResponse,
  Booking,
  BookingFilters,
  PaginatedResponse,
  CreateBookingRequest,
  CancelBookingRequest,
  CheckSlotAvailabilityResponse,
} from '../types/api.types';

class BookingsService {
  /**
   * Проверить доступность слота
   */
  async checkSlotAvailability(slotId: string): Promise<CheckSlotAvailabilityResponse> {
    const response = await apiClient.get<ApiResponse<CheckSlotAvailabilityResponse>>(
      `/bookings/check/${slotId}`
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to check availability');
  }

  /**
   * Получить список бронирований
   */
  async getBookings(filters?: BookingFilters): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
const response = await apiClient.get<ApiResponse<any>>(
      `/bookings?${params.toString()}`
    );

    if (response.data.data) {
      const apiData = response.data.data;
      return {
        data: apiData.bookings || [],
        pagination: apiData.pagination
      };
    }
    
    throw new Error('Failed to fetch bookings');
  }

  /**
   * Получить бронирование по ID
   */
  async getBookingById(id: string): Promise<Booking> {
    const response = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Booking not found');
  }

  /**
   * Создать новое бронирование
   */
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await apiClient.post<ApiResponse<Booking>>('/bookings', data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create booking');
  }

  /**
   * Отменить бронирование
   */
  async cancelBooking(id: string, data?: CancelBookingRequest): Promise<Booking> {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `/bookings/${id}/cancel`,
      data
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to cancel booking');
  }

  /**
   * Обновить статус бронирования (только Admin)
   */
  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const response = await apiClient.put<ApiResponse<Booking>>(
      `/bookings/${id}/status`,
      { status }
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update booking status');
  }
}

export default new BookingsService();
