/**
 * Home Page (Venues List)
 * 
 * Главная страница со списком площадок
 */

import React, { useState, useEffect } from 'react';
import venuesService from '../api/venues.service';
import type { Venue, VenueType } from '../types/api.types';

export const HomePage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<VenueType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVenues();
  }, [typeFilter, searchQuery]);

  const loadVenues = async () => {
    setIsLoading(true);
    setError('');

    try {
      const filters: any = {
        page: 1,
        limit: 12,
      };

      if (typeFilter) {
        filters.type = typeFilter;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await venuesService.getVenues(filters);
      setVenues(response.data || []);
    } catch (err: any) {
      setError('Ошибка загрузки площадок');
      console.error(err);
      setVenues([]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="container">
      <div className="page-header">
        <h1>Спортивные площадки</h1>
        <p>Выберите площадку и забронируйте удобное время</p>
      </div>

      {/* Фильтры */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="type-filter">Тип площадки:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VenueType | '')}
          >
            <option value="">Все</option>
            <option value="FOOTBALL">Футбол</option>
            <option value="BASKETBALL">Баскетбол</option>
            <option value="TENNIS">Теннис</option>
            <option value="VOLLEYBALL">Волейбол</option>
            <option value="BADMINTON">Бадминтон</option>
            <option value="FUTSAL">Футзал</option>
            <option value="HOCKEY">Хоккей</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search">Поиск:</label>
          <input
            type="text"
            id="search"
            placeholder="Название площадки..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Контент */}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка площадок...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!isLoading && !error && (!venues || venues.length === 0) && (
        <div className="empty-state">
          <p>Площадки не найдены</p>
        </div>
      )}

      {!isLoading && !error && venues && venues.length > 0 && (
        <div className="venues-grid">
          {venues.map((venue) => (
            <div key={venue.id} className="venue-card">
              {venue.imageUrl && (
                <div className="venue-image">
                  <img src={venue.imageUrl} alt={venue.name} />
                </div>
              )}

              <div className="venue-content">
                <div className="venue-header">
                  <h3>{venue.name}</h3>
                  <span className="venue-type">{getVenueTypeLabel(venue.type)}</span>
                </div>

                <p className="venue-address">📍 {venue.address}</p>

                {venue.description && (
                  <p className="venue-description">{venue.description}</p>
                )}

                <div className="venue-footer">
                  <div className="venue-price">
                    <strong>{venue.pricePerHour} BYN</strong> / час
                  </div>

                  {venue.averageRating && (
                    <div className="venue-rating">
                      ⭐ {venue.averageRating.toFixed(1)} ({venue.reviewCount})
                    </div>
                  )}
                </div>

                <a
                  href={`/venues/${venue.id}`}
                  className="btn btn-primary btn-block"
                  style={{ textDecoration: 'none' }}
                >
                  Подробнее
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
