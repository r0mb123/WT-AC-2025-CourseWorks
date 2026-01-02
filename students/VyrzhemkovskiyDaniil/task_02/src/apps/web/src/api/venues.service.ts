/**
 * Venues API Service
 * 
 * Сервис для работы с площадками
 */

import apiClient from './apiClient';
import type {
  ApiResponse,
  Venue,
  VenueFilters,
  PaginatedResponse,
  CreateVenueRequest,
  UpdateVenueRequest,
} from '../types/api.types';

class VenuesService {
  /**
   * Получить список площадок с фильтрацией
   */
  async getVenues(filters?: VenueFilters): Promise<PaginatedResponse<Venue>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<ApiResponse<any>>(
      `/venues?${params.toString()}`
    );
    
    if (response.data.data) {
      // Backend возвращает { venues: [...], pagination: {...} }
      // Преобразуем в { data: [...], pagination: {...} }
      const apiData = response.data.data;
      return {
        data: apiData.venues || [],
        pagination: apiData.pagination
      };
    }
    
    throw new Error('Failed to fetch venues');
  }

  /**
   * Получить площадку по ID
   */
  async getVenueById(id: string): Promise<Venue> {
    const response = await apiClient.get<ApiResponse<Venue>>(`/venues/${id}`);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Venue not found');
  }

  /**
   * Создать новую площадку (только Admin)
   */
  async createVenue(data: CreateVenueRequest): Promise<Venue> {
    const response = await apiClient.post<ApiResponse<Venue>>('/venues', data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create venue');
  }

  /**
   * Обновить площадку (только Admin)
   */
  async updateVenue(id: string, data: UpdateVenueRequest): Promise<Venue> {
    const response = await apiClient.put<ApiResponse<Venue>>(
      `/venues/${id}`,
      data
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update venue');
  }

  /**
   * Удалить площадку (только Admin)
   */
  async deleteVenue(id: string): Promise<void> {
    await apiClient.delete(`/venues/${id}`);
  }
}

export default new VenuesService();
