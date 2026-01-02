/**
 * Venue Details Page
 * 
 * Страница с детальной информацией о площадке
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import venuesService from '../api/venues.service';
import slotsService from '../api/slots.service';
import reviewsService from '../api/reviews.service';
import bookingsService from '../api/bookings.service';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatTime, getNextDays, calculateDurationHours } from '../utils/dateUtils';
import type { Venue, Slot, Review, VenueType } from '../types/api.types';

export const VenueDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string>('');

  // Загрузка данных площадки
  useEffect(() => {
    if (id) {
      loadVenueDetails();
      loadReviews();
    }
  }, [id]);

  // Загрузка слотов при изменении даты
  useEffect(() => {
    if (id) {
      loadSlots();
    }
  }, [id, selectedDate]);

  const loadVenueDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const venueData = await venuesService.getVenueById(id!);
      setVenue(venueData);
    } catch (err: any) {
      setError('Не удалось загрузить информацию о площадке');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const response = await slotsService.getSlots({
        venueId: id!,
        date: dateStr,
        limit: 100,
      });
      setSlots(response.data || []);
    } catch (err: any) {
      console.error('Failed to load slots:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await reviewsService.getReviews({
        venueId: id!,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });
      setReviews(response.data || []);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handleBookSlot = async (slot: Slot) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/venues/${id}` } });
      return;
    }

    setSelectedSlot(slot);
    setError('');
    setSuccessMessage('');
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setError('');

    try {
      await bookingsService.createBooking({
        slotId: selectedSlot.id,
      });

      setSuccessMessage('Бронирование успешно создано!');
      setSelectedSlot(null);
      
      // Перезагрузить слоты
      await loadSlots();
      
      // Перенаправить на страницу бронирований через 2 секунды
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании бронирования');
    } finally {
      setIsBooking(false);
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

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/venues/${id}` } });
      return;
    }

    if (reviewComment.trim().length < 10) {
      setReviewError('Комментарий должен содержать минимум 10 символов');
      return;
    }

    setIsSubmittingReview(true);

    try {
      await reviewsService.createReview({
        venueId: id!,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      // Reset form
      setReviewRating(5);
      setReviewComment('');
      setShowReviewForm(false);
      setSuccessMessage('Отзыв успешно добавлен!');

      // Reload reviews
      await loadReviews();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Не удалось добавить отзыв');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const canLeaveReview = () => {
    if (!isAuthenticated || !user) return false;
    // Check if user already left a review
    return !reviews.some((review) => review.userId === user.id);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !venue) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Вернуться к списку площадок
        </button>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container">
        <p>Площадка не найдена</p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');
  const nextDays = getNextDays(7);

  return (
    <div className="container">
      {/* Venue Header */}
      <div className="venue-details-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Назад к списку
        </button>

        <div className="venue-details-info">
          <div className="venue-details-main">
            <h1>{venue.name}</h1>
            <div className="venue-meta">
              <span className="venue-type-badge">{getVenueTypeLabel(venue.type)}</span>
              {venue.averageRating && (
                <div className="venue-rating-inline">
                  ⭐ {venue.averageRating.toFixed(1)} ({venue.reviewCount} отзывов)
                </div>
              )}
            </div>
            <p className="venue-address">📍 {venue.address}</p>
          </div>

          <div className="venue-details-price">
            <div className="price-label">Стоимость</div>
            <div className="price-value">{venue.pricePerHour} BYN / час</div>
          </div>
        </div>

        {venue.imageUrl && (
          <div className="venue-details-image">
            <img src={venue.imageUrl} alt={venue.name} />
          </div>
        )}

        {venue.description && (
          <div className="venue-description">
            <h3>Описание</h3>
            <p>{venue.description}</p>
          </div>
        )}

        {venue.amenities && venue.amenities.length > 0 && (
          <div className="venue-amenities">
            <h3>Удобства</h3>
            <div className="amenities-list">
              {venue.amenities.map((amenity, index) => (
                <span key={index} className="amenity-badge">
                  ✓ {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Section */}
      <div className="booking-section">
        <h2>Бронирование</h2>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* Date Selector */}
        <div className="date-selector">
          <h3>Выберите дату</h3>
          <div className="date-buttons">
            {nextDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`date-button ${
                  formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(day, 'yyyy-MM-dd')
                    ? 'active'
                    : ''
                }`}
              >
                <div className="date-day">{formatDate(day, 'EEE')}</div>
                <div className="date-number">{formatDate(day, 'd')}</div>
                <div className="date-month">{formatDate(day, 'MMM')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="slots-section">
          <h3>
            Доступные слоты на {formatDate(selectedDate, 'dd MMMM yyyy')}
          </h3>

          {!availableSlots || availableSlots.length === 0 ? (
            <div className="empty-state">
              <p>На выбранную дату нет доступных слотов</p>
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot) => {
                const duration = calculateDurationHours(slot.startTime, slot.endTime);
                const price = (venue.pricePerHour * duration).toFixed(2);

                return (
                  <div key={slot.id} className="slot-card">
                    <div className="slot-time">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                    <div className="slot-duration">{duration} ч</div>
                    <div className="slot-price">{price} BYN</div>
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="btn btn-primary btn-sm"
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? 'Забронировать' : 'Войдите для бронирования'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Отзывы</h2>
          {canLeaveReview() && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn btn-primary btn-sm"
            >
              Оставить отзыв
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="review-form-container">
            <form onSubmit={handleSubmitReview} className="review-form">
              <h3>Оставьте свой отзыв</h3>

              <div className="form-group">
                <label htmlFor="rating">Рейтинг</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-button ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                      aria-label={`Оценка ${star} звезд`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-value">{reviewRating} из 5</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Комментарий (минимум 10 символов)</label>
                <textarea
                  id="comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Поделитесь впечатлениями о площадке..."
                  required
                  minLength={10}
                />
                <small className="char-count">
                  {reviewComment.length} символов
                </small>
              </div>

              {reviewError && <div className="error-message">{reviewError}</div>}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingReview || reviewComment.trim().length < 10}
                >
                  {isSubmittingReview ? 'Отправка...' : 'Отправить отзыв'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewComment('');
                    setReviewRating(5);
                    setReviewError('');
                  }}
                  className="btn btn-secondary"
                  disabled={isSubmittingReview}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {!reviews || reviews.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет отзывов. Будьте первым!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    <strong>{review.user?.name}</strong>
                  </div>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                </div>
                {review.comment && <p className="review-comment">{review.comment}</p>}
                <div className="review-date">
                  {formatDate(review.createdAt, 'dd.MM.yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Подтверждение бронирования</h2>

            <div className="booking-details">
              <p>
                <strong>Площадка:</strong> {venue.name}
              </p>
              <p>
                <strong>Дата:</strong> {formatDate(selectedSlot.startTime, 'dd MMMM yyyy')}
              </p>
              <p>
                <strong>Время:</strong> {formatTime(selectedSlot.startTime)} -{' '}
                {formatTime(selectedSlot.endTime)}
              </p>
              <p>
                <strong>Длительность:</strong>{' '}
                {calculateDurationHours(selectedSlot.startTime, selectedSlot.endTime)} ч
              </p>
              <p className="booking-total-price">
                <strong>Стоимость:</strong>{' '}
                {(
                  venue.pricePerHour *
                  calculateDurationHours(selectedSlot.startTime, selectedSlot.endTime)
                ).toFixed(2)}{' '}
                BYN
              </p>
            </div>

            <div className="modal-actions">
              <button
                onClick={confirmBooking}
                className="btn btn-primary"
                disabled={isBooking}
              >
                {isBooking ? 'Бронирование...' : 'Подтвердить'}
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                className="btn btn-secondary"
                disabled={isBooking}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
