/**
 * Slots API Service
 * 
 * Сервис для работы с временными слотами
 */

import apiClient from './apiClient';
import type {
  ApiResponse,
  Slot,
  SlotFilters,
  PaginatedResponse,
  CreateSlotRequest,
  BulkCreateSlotsRequest,
  BulkCreateSlotsResponse,
} from '../types/api.types';

class SlotsService {
  /**
   * Получить список слотов с фильтрацией
   */
  async getSlots(filters?: SlotFilters): Promise<PaginatedResponse<Slot>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<ApiResponse<any>>(
      `/slots?${params.toString()}`
    );
    
    if (response.data.data) {
      const apiData = response.data.data;
      return {
        data: apiData.slots || [],
        pagination: apiData.pagination
      };
    }
    
    throw new Error('Failed to fetch slots');
  }

  /**
   * Получить слот по ID
   */
  async getSlotById(id: string): Promise<Slot> {
    const response = await apiClient.get<ApiResponse<Slot>>(`/slots/${id}`);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Slot not found');
  }

  /**
   * Создать новый слот (только Admin/Owner)
   */
  async createSlot(data: CreateSlotRequest): Promise<Slot> {
    const response = await apiClient.post<ApiResponse<Slot>>('/slots', data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create slot');
  }

  /**
   * Массовое создание слотов (только Admin/Owner)
   */
  async createBulkSlots(data: BulkCreateSlotsRequest): Promise<BulkCreateSlotsResponse> {
    const response = await apiClient.post<ApiResponse<BulkCreateSlotsResponse>>(
      '/slots/bulk',
      data
    );
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create bulk slots');
  }

  /**
   * Обновить слот (только Admin/Owner)
   */
  async updateSlot(id: string, data: Partial<CreateSlotRequest>): Promise<Slot> {
    const response = await apiClient.put<ApiResponse<Slot>>(`/slots/${id}`, data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update slot');
  }

  /**
   * Удалить слот (только Admin/Owner)
   */
  async deleteSlot(id: string): Promise<void> {
    await apiClient.delete(`/slots/${id}`);
  }
}

export default new SlotsService();
