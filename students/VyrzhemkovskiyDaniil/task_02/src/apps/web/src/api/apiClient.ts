/**
 * API Client Configuration
 * 
 * Централизованная настройка Axios для всех API запросов
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Debug logging
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  mode: import.meta.env.MODE,
});

// Создание Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавляем JWT токен
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('📡 API Request:', config.method?.toUpperCase(), config.url, config.baseURL);
    
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', error.config?.url, error.message);
    
    if (error.response) {
      // Сервер вернул ошибку
      const { status } = error.response;
      console.error('   Status:', status, 'Data:', error.response.data);
      
      switch (status) {
        case 401:
          // Unauthorized - удаляем токен и редиректим на login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        
        case 403:
          // Forbidden - нет прав доступа
          console.error('Access forbidden');
          break;
        
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Запрос отправлен, но ответа нет
      console.error('No response from server');
    } else {
      // Ошибка при настройке запроса
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
