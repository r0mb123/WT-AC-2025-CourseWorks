/**
 * Auth API Service
 * 
 * Сервис для работы с аутентификацией и авторизацией
 */

import apiClient from './apiClient';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../types/api.types';

class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    
    if (response.data.data) {
      // Сохраняем токен и пользователя
      this.saveAuth(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  /**
   * Вход в систему
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    
    if (response.data.data) {
      // Сохраняем токен и пользователя
      this.saveAuth(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.data) {
      // Обновляем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error('Failed to fetch user');
  }

  /**
   * Выход из системы
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Проверка авторизации
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Получить токен из localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Получить пользователя из localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(data: { name?: string; email?: string; phone?: string }): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
    
    if (response.data.data) {
      // Обновляем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error('Failed to update profile');
  }

  /**
   * Сменить пароль
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.put('/auth/password', data);
  }

  /**
   * Сохранить auth данные в localStorage
   */
  private saveAuth(authData: AuthResponse): void {
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }
}

export default new AuthService();
