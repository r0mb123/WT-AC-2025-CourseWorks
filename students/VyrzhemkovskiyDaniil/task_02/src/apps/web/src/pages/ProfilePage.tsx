/**
 * Profile Page
 * 
 * Страница профиля пользователя
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth.service';

// Вспомогательный интерфейс для axios error
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (err: unknown): string => {
  const error = err as ApiError;
  return error.response?.data?.message || 'Произошла ошибка';
};

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim() || !email.trim()) {
      setProfileError('Имя и email обязательны');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setProfileError('Некорректный email');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      setUser(updatedUser);
      setProfileSuccess('Профиль успешно обновлен!');
      setIsEditingProfile(false);

      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: unknown) {
      setProfileError(getErrorMessage(err) || 'Ошибка при обновлении профиля');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Все поля обязательны');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен быть минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('Новый пароль должен отличаться от текущего');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Пароль успешно изменен!');
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err) || 'Ошибка при смене пароля');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const cancelProfileEdit = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
    setIsEditingProfile(false);
    setProfileError('');
  };

  const cancelPasswordEdit = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
    setPasswordError('');
  };

  if (!user) {
    return (
      <div className="container">
        <div className="error-message">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Мой профиль</h1>
      </div>

      {profileSuccess && <div className="success-message">{profileSuccess}</div>}
      {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

      {/* Profile Information Section */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>Личная информация</h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn btn-secondary btn-sm"
            >
              Редактировать
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="profile-info">
            <div className="profile-info-item">
              <span className="profile-label">Имя:</span>
              <span className="profile-value">{user.name}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Телефон:</span>
              <span className="profile-value">{user.phone || 'Не указан'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Роль:</span>
              <span className="profile-value">
                {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Дата регистрации:</span>
              <span className="profile-value">
                {new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Имя *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+375 XX XXX-XX-XX"
              />
            </div>

            {profileError && <div className="error-message">{profileError}</div>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={cancelProfileEdit}
                className="btn btn-secondary"
                disabled={isUpdatingProfile}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Section */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>Безопасность</h2>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="btn btn-secondary btn-sm"
            >
              Сменить пароль
            </button>
          )}
        </div>

        {!isEditingPassword ? (
          <div className="profile-info">
            <div className="profile-info-item">
              <span className="profile-label">Пароль:</span>
              <span className="profile-value">••••••••</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Текущий пароль *</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Новый пароль * (минимум 6 символов)</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите новый пароль *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                required
              />
            </div>

            {passwordError && <div className="error-message">{passwordError}</div>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Изменение...' : 'Изменить пароль'}
              </button>
              <button
                type="button"
                onClick={cancelPasswordEdit}
                className="btn btn-secondary"
                disabled={isChangingPassword}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
