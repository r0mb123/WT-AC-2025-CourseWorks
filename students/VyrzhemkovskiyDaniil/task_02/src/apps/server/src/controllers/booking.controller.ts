import { Request, Response, NextFunction } from 'express';
import bookingService from '../services/booking.service';
import {
  CreateBookingSchema,
  UpdateBookingStatusSchema,
  GetBookingsQuerySchema,
} from '../types/booking.types';
import { AuthRequest } from '../types/auth.types';

/**
 * Контроллер для управления бронированиями
 */
class BookingController {
  /**
   * Получить список бронирований
   * GET /api/bookings
   */
  async getBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = GetBookingsQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';

      const result = await bookingService.getBookings(query, userId, isAdmin);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получить бронирование по ID
   * GET /api/bookings/:id
   */
  async getBookingById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';

      const booking = await bookingService.getBookingById(id, userId, isAdmin);

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Проверить доступность слота
   * GET /api/bookings/check/:slotId
   */
  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slotId } = req.params;

      const availability = await bookingService.checkSlotAvailability(slotId);

      res.json(availability);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создать новое бронирование
   * POST /api/bookings
   */
  async createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateBookingSchema.parse(req.body);
      const userId = req.user!.userId;

      const booking = await bookingService.createBooking(data, userId);

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Отменить бронирование
   * POST /api/bookings/:id/cancel
   */
  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'ADMIN';

      const booking = await bookingService.cancelBooking(id, userId, isAdmin);

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновить статус бронирования (только админ)
   * PUT /api/bookings/:id/status
   */
  async updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateBookingStatusSchema.parse(req.body);

      const booking = await bookingService.updateBookingStatus(id, data);

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();
