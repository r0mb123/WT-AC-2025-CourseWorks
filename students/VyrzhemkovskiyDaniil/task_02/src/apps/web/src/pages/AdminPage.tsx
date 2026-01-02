/**
 * Admin Page
 * 
 * Административная панель для управления площадками, слотами и бронированиями
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import venuesService from '../api/venues.service';
import slotsService from '../api/slots.service';
import bookingsService from '../api/bookings.service';
import { formatDate, formatTime } from '../utils/dateUtils';
import { BookingStatus } from '../types/api.types';
import type { Venue, Slot, Booking, VenueType } from '../types/api.types';

type AdminTab = 'venues' | 'slots' | 'bookings';

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

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('venues');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  // Venues state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedVenueForSlots, setSelectedVenueForSlots] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showBulkSlotForm, setShowBulkSlotForm] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Messages
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'venues') {
      loadVenues();
    } else if (activeTab === 'slots') {
      loadVenues(); // Need venues for slot management
    } else if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [activeTab]);

  const loadVenues = async () => {
    setIsLoadingVenues(true);
    try {
      const response = await venuesService.getVenues({ limit: 100 });
      setVenues(response.data || []);
    } catch (err: unknown) {
      setErrorMessage('Не удалось загрузить площадки');
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const loadSlots = async (venueId: string) => {
    if (!venueId) return;
    
    setIsLoadingSlots(true);
    try {
      const response = await slotsService.getSlots({ venueId, limit: 100 });
      setSlots(response.data || []);
    } catch (err: unknown) {
      setErrorMessage('Не удалось загрузить слоты');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const loadBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const filters: { limit: number; status?: BookingStatus } = { limit: 100 };
      if (bookingStatusFilter !== 'ALL') {
        filters.status = bookingStatusFilter as BookingStatus;
      }
      const response = await bookingsService.getBookings(filters);
      setBookings(response.data || []);
    } catch (err: unknown) {
      setErrorMessage('Не удалось загрузить бронирования');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту площадку?')) return;

    try {
      await venuesService.deleteVenue(venueId);
      setSuccessMessage('Площадка успешно удалена!');
      loadVenues();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err) || 'Ошибка при удалении площадки');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот слот?')) return;

    try {
      await slotsService.deleteSlot(slotId);
      setSuccessMessage('Слот успешно удален!');
      if (selectedVenueForSlots) {
        loadSlots(selectedVenueForSlots);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err) || 'Ошибка при удалении слота');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    if (!confirm(`Изменить статус бронирования на "${status}"?`)) return;

    try {
      await bookingsService.updateBookingStatus(bookingId, status);
      setSuccessMessage('Статус бронирования обновлен!');
      loadBookings();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err) || 'Ошибка при обновлении статуса');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getVenueTypeLabel = (type: VenueType): string => {
    const labels: Record<VenueType, string> = {
      FOOTBALL: 'Футбол',
      BASKETBALL: 'Баскетбол',
      TENNIS: 'Теннис',
      VOLLEYBALL: 'Волейбол',
      BADMINTON: 'Бадминтон',
      FUTSAL: 'Футзал',
      HOCKEY: 'Хоккей',
      OTHER: 'Другое',
    };
    return labels[type];
  };

  const getStatusLabel = (status: BookingStatus): string => {
    const labels: Record<BookingStatus, string> = {
      PENDING: 'Ожидает',
      CONFIRMED: 'Подтверждено',
      CANCELLED: 'Отменено',
      COMPLETED: 'Завершено',
    };
    return labels[status];
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Админ-панель</h1>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          Площадки ({venues?.length || 0})
        </button>
        <button
          className={`admin-tab ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          Слоты
        </button>
        <button
          className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Бронирования ({bookings?.length || 0})
        </button>
      </div>

      {/* Venues Tab */}
      {activeTab === 'venues' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Управление площадками</h2>
            <button
              onClick={() => {
                setEditingVenue(null);
                setShowVenueForm(true);
              }}
              className="btn btn-primary"
            >
              Добавить площадку
            </button>
          </div>

          {isLoadingVenues ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Адрес</th>
                    <th>Цена/час</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map((venue) => (
                    <tr key={venue.id}>
                      <td>{venue.name}</td>
                      <td>{getVenueTypeLabel(venue.type)}</td>
                      <td>{venue.address}</td>
                      <td>{venue.pricePerHour} BYN</td>
                      <td>
                        <span className={`status-badge ${venue.isActive ? 'active' : 'inactive'}`}>
                          {venue.isActive ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <button
                          onClick={() => navigate(`/venues/${venue.id}`)}
                          className="btn-icon"
                          title="Просмотр"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            setEditingVenue(venue);
                            setShowVenueForm(true);
                          }}
                          className="btn-icon"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="btn-icon btn-danger"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Управление слотами</h2>
            <button
              onClick={() => setShowBulkSlotForm(true)}
              className="btn btn-primary"
              disabled={!selectedVenueForSlots}
            >
              Создать слоты
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="venue-select">Выберите площадку</label>
            <select
              id="venue-select"
              value={selectedVenueForSlots}
              onChange={(e) => {
                setSelectedVenueForSlots(e.target.value);
                if (e.target.value) {
                  loadSlots(e.target.value);
                } else {
                  setSlots([]);
                }
              }}
            >
              <option value="">-- Выберите площадку --</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          {selectedVenueForSlots && (
            <>
              {isLoadingSlots ? (
                <div className="loading">Загрузка...</div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Начало</th>
                        <th>Конец</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!slots || slots.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center">
                            Нет слотов для этой площадки
                          </td>
                        </tr>
                      ) : (
                        slots.map((slot) => (
                          <tr key={slot.id}>
                            <td>{formatDate(slot.startTime, 'dd.MM.yyyy')}</td>
                            <td>{formatTime(slot.startTime)}</td>
                            <td>{formatTime(slot.endTime)}</td>
                            <td>
                              <span className={`status-badge ${slot.isBooked ? 'booked' : 'available'}`}>
                                {slot.isBooked ? 'Забронирован' : 'Доступен'}
                              </span>
                            </td>
                            <td className="admin-table-actions">
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="btn-icon btn-danger"
                                title="Удалить"
                                disabled={slot.isBooked}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Управление бронированиями</h2>
            <select
              value={bookingStatusFilter}
              onChange={(e) => {
                setBookingStatusFilter(e.target.value as BookingStatus | 'ALL');
              }}
              className="filter-select"
            >
              <option value="ALL">Все статусы</option>
              <option value="PENDING">Ожидает</option>
              <option value="CONFIRMED">Подтверждено</option>
              <option value="CANCELLED">Отменено</option>
              <option value="COMPLETED">Завершено</option>
            </select>
          </div>

          <button onClick={loadBookings} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
            Обновить
          </button>

          {isLoadingBookings ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Площадка</th>
                    <th>Дата/Время</th>
                    <th>Цена</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {!bookings || bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center">
                        Нет бронирований
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id.substring(0, 8)}...</td>
                        <td>{booking.user?.name || booking.user?.email}</td>
                        <td>{booking.slot?.venue?.name}</td>
                        <td>
                          {formatDate(booking.slot?.startTime, 'dd.MM.yyyy')}<br />
                          {formatTime(booking.slot?.startTime)} - {formatTime(booking.slot?.endTime)}
                        </td>
                        <td>{booking.totalPrice} BYN</td>
                        <td>
                          <span className={`status-${booking.status.toLowerCase()}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="admin-table-actions">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, BookingStatus.CONFIRMED)}
                                className="btn-sm btn-success"
                                title="Подтвердить"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, BookingStatus.CANCELLED)}
                                className="btn-sm btn-danger"
                                title="Отменить"
                              >
                                ✗
                              </button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, BookingStatus.COMPLETED)}
                              className="btn-sm btn-primary"
                              title="Завершить"
                            >
                              ✓✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Placeholder notices for forms */}
      {showVenueForm && (
        <div className="modal-overlay" onClick={() => setShowVenueForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingVenue ? 'Редактирование площадки' : 'Создание площадки'}</h3>
            <p className="text-secondary">
              Форма CRUD площадок будет реализована в следующей итерации.
              <br />
              Базовый функционал просмотра, редактирования и удаления доступен через API.
            </p>
            <button onClick={() => setShowVenueForm(false)} className="btn btn-secondary">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showBulkSlotForm && (
        <div className="modal-overlay" onClick={() => setShowBulkSlotForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Массовое создание слотов</h3>
            <p className="text-secondary">
              Форма массового создания слотов будет реализована в следующей итерации.
              <br />
              Используйте API эндпоинт POST /api/slots/bulk для создания слотов.
            </p>
            <button onClick={() => setShowBulkSlotForm(false)} className="btn btn-secondary">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
