/**
 * Protected Route Component
 * 
 * Компонент для защиты маршрутов, требующих авторизации
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/api.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Перенаправляем на страницу входа, сохраняя текущий URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка ролей, если указаны
  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <div className="container">
          <div className="error-message">
            <h2>Доступ запрещён</h2>
            <p>У вас нет прав для просмотра этой страницы.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
