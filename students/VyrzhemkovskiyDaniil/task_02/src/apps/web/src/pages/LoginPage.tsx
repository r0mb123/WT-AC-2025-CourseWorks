/**
 * Login Page
 * 
 * Страница входа в систему
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types/api.types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа. Проверьте email и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Вход в систему</h1>
          <p className="subtitle">Войдите, чтобы забронировать площадку</p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Ваш пароль"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Нет аккаунта?{' '}
              <Link to="/register">Зарегистрироваться</Link>
            </p>
          </div>

          <div className="demo-credentials">
            <p><strong>Тестовые учётные данные:</strong></p>
            <p>Admin: admin@sports-venues.com / password123</p>
            <p>User: user1@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
