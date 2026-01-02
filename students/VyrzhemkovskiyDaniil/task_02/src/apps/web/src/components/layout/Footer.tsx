/**
 * Footer Component
 * 
 * Подвал сайта
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Спортплощадки «Играем?»</h3>
            <p>Платформа для бронирования спортивных площадок</p>
          </div>

          <div className="footer-section">
            <h4>Навигация</h4>
            <ul>
              <li><a href="/">Площадки</a></li>
              <li><a href="/my-bookings">Мои бронирования</a></li>
              <li><a href="/profile">Профиль</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Контакты</h4>
            <ul>
              <li>Email: info@sports-venues.com</li>
              <li>Телефон: +375 (29) 123-45-67</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Спортплощадки «Играем?». Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};
