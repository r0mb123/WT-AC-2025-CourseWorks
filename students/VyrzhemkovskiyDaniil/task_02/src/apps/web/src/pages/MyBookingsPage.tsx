/**
 * My Bookings Page
 * 
 * Страница со списком бронирований пользователя
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingsService from '../api/bookings.service';
import { formatDate, formatTime, formatDateTime, calculateDurationHours, isPastDate } from '../utils/dateUtils';
import type { Booking, BookingStatus, VenueType } from '../types/api.types';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  
  // Отмена бронирования
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const filters: any = {
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        order: 'desc',
      };

      if (statusFilter) {
        filters.status = statusFilter;
      }

      const response = await bookingsService.getBookings(filters);
      setBookings(response.data || []);
    } catch (err: any) {
      setError('Не удалось загрузить бронирования');
      setBookings([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBookingId) return;

    setIsCancelling(true);
    setError('');

    try {
      await bookingsService.cancelBooking(cancellingBookingId, {
        reason: cancelReason || undefined,
      });

      setSuccessMessage('Бронирование успешно отменено');
      setCancellingBookingId(null);
      setCancelReason('');
      
      // Перезагрузить список
      await loadBookings();

      // Скрыть success сообщение через 3 секунды
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось отменить бронирование');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusLabel = (status: BookingStatus): string => {
    const labels: Record<BookingStatus, string> = {
      PENDING: 'Ожидает подтверждения',
      CONFIRMED: 'Подтверждено',
      CANCELLED: 'Отменено',
      COMPLETED: 'Завершено',
    };
    return labels[status];
  };

  const getStatusColor = (status: BookingStatus): string => {
    const colors: Record<BookingStatus, string> = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      CANCELLED: 'status-cancelled',
      COMPLETED: 'status-completed',
    };
    return colors[status];
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

  const canCancelBooking = (booking: Booking): boolean => {
    // Можно отменить только если статус PENDING или CONFIRMED
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return false;
    }

    // Нельзя отменить, если слот уже прошёл
    if (booking.slot && isPastDate(booking.slot.startTime)) {
      return false;
    }

    return true;
  };

  const getRefundInfo = (booking: Booking): string => {
    if (!booking.slot) return '';

    const startTime = new Date(booking.slot.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart > 24) {
      return '100% возврат средств';
    } else if (hoursUntilStart > 12) {
      return '50% возврат средств';
    } else if (hoursUntilStart > 0) {
      return 'Возврат не предусмотрен';
    } else {
      return 'Время истекло';
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка бронирований...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Мои бронирования</h1>
        <p>Управляйте своими бронированиями площадок</p>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Фильтры */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Статус:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
          >
            <option value="">Все</option>
            <option value="PENDING">Ожидает подтверждения</option>
            <option value="CONFIRMED">Подтверждено</option>
            <option value="COMPLETED">Завершено</option>
            <option value="CANCELLED">Отменено</option>
          </select>
        </div>
      </div>

      {/* Список бронирований */}
      {!bookings || bookings.length === 0 ? (
        <div className="empty-state">
          <h3>У вас пока нет бронирований</h3>
          <p>Начните с поиска подходящей площадки</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Посмотреть площадки
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-venue-info">
                  <h3>
                    <a href={`/venues/${booking.slot?.venue.id}`}>
                      {booking.slot?.venue.name}
                    </a>
                  </h3>
                  <span className="venue-type-small">
                    {booking.slot?.venue.type && getVenueTypeLabel(booking.slot.venue.type)}
                  </span>
                </div>
                <div className={`booking-status ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </div>
              </div>

              {booking.slot && (
                <>
                  <div className="booking-details-grid">
                    <div className="booking-detail">
                      <span className="detail-label">📅 Дата:</span>
                      <span className="detail-value">
                        {formatDate(booking.slot.startTime, 'dd MMMM yyyy')}
                      </span>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-label">⏰ Время:</span>
                      <span className="detail-value">
                        {formatTime(booking.slot.startTime)} - {formatTime(booking.slot.endTime)}
                      </span>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-label">⏱️ Длительность:</span>
                      <span className="detail-value">
                        {calculateDurationHours(booking.slot.startTime, booking.slot.endTime)} ч
                      </span>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-label">💰 Стоимость:</span>
                      <span className="detail-value booking-price">
                        {booking.totalPrice.toFixed(2)} BYN
                      </span>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-label">📍 Адрес:</span>
                      <span className="detail-value">{booking.slot.venue.address}</span>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-label">🕒 Создано:</span>
                      <span className="detail-value">
                        {formatDateTime(booking.createdAt)}
                      </span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="booking-notes">
                      <strong>Примечания:</strong> {booking.notes}
                    </div>
                  )}

                  {booking.cancellationReason && (
                    <div className="booking-cancellation">
                      <strong>Причина отмены:</strong> {booking.cancellationReason}
                    </div>
                  )}

                  {booking.refundAmount !== null && booking.refundAmount !== undefined && (
                    <div className="booking-refund">
                      <strong>Возвращено:</strong> {booking.refundAmount.toFixed(2)} BYN
                    </div>
                  )}
                </>
              )}

              <div className="booking-actions">
                {canCancelBooking(booking) && (
                  <button
                    onClick={() => setCancellingBookingId(booking.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Отменить бронирование
                  </button>
                )}

                {booking.slot && canCancelBooking(booking) && (
                  <span className="refund-info">{getRefundInfo(booking)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancellingBookingId && (
        <div className="modal-overlay" onClick={() => setCancellingBookingId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Отменить бронирование</h2>

            <p>Вы уверены, что хотите отменить это бронирование?</p>

            {(() => {
              const booking = bookings.find((b) => b.id === cancellingBookingId);
              return booking ? (
                <div className="cancel-booking-info">
                  <p>
                    <strong>Площадка:</strong> {booking.slot?.venue.name}
                  </p>
                  <p>
                    <strong>Дата и время:</strong>{' '}
                    {booking.slot && formatDate(booking.slot.startTime, 'dd MMMM yyyy')},{' '}
                    {booking.slot && formatTime(booking.slot.startTime)} -{' '}
                    {booking.slot && formatTime(booking.slot.endTime)}
                  </p>
                  <p className="refund-warning">
                    <strong>Возврат средств:</strong> {getRefundInfo(booking)}
                  </p>
                </div>
              ) : null;
            })()}

            <div className="form-group">
              <label htmlFor="cancel-reason">Причина отмены (опционально):</label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Укажите причину отмены..."
                rows={3}
                disabled={isCancelling}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={handleCancelBooking}
                className="btn btn-danger"
                disabled={isCancelling}
              >
                {isCancelling ? 'Отмена...' : 'Подтвердить отмену'}
              </button>
              <button
                onClick={() => {
                  setCancellingBookingId(null);
                  setCancelReason('');
                }}
                className="btn btn-secondary"
                disabled={isCancelling}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
