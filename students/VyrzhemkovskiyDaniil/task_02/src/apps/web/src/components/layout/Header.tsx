/**
 * Header Component
 * 
 * Шапка сайта с навигацией
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            🏀 Спортплощадки «Играем?»
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">
              Площадки
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/my-bookings" className="nav-link">
                  Мои бронирования
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="nav-link">
                    Админ-панель
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to="/profile" className="user-link">
                  👤 {user?.name}
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Выйти
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Вход
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
