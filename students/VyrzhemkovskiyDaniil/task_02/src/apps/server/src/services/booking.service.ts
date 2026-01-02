import { BookingStatus, PaymentStatus, SlotStatus } from '@prisma/client';
import prisma from '../utils/prisma.util';
import { AppError } from '../middleware/error.middleware';
import {
  CreateBookingInput,
  UpdateBookingStatusInput,
  GetBookingsQuery,
  BookingResponse,
  BookingsListResponse,
  RefundInfo,
  SlotAvailability,
} from '../types/booking.types';

/**
 * Сервис для управления бронированиями
 */
class BookingService {
  /**
   * Получить список бронирований с фильтрацией
   */
  async getBookings(query: GetBookingsQuery, requestUserId: string, isAdmin: boolean): Promise<BookingsListResponse> {
    const { userId, venueId, slotId, status, startDate, endDate, page = 1, limit = 20 } = query;

    // Построение фильтров
    const where: Record<string, unknown> = {};

    // Обычный пользователь видит только свои бронирования
    if (!isAdmin) {
      where.userId = requestUserId;
    } else if (userId) {
      // Админ может фильтровать по пользователю
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (slotId) {
      where.slotId = slotId;
    }

    // Фильтр по площадке (через slot)
    if (venueId) {
      (where as { slot?: { venueId?: string; startTime?: { gte?: Date; lte?: Date } } }).slot = {
        venueId,
      };
    }

    // Фильтр по датам (через slot.startTime)
    if (startDate || endDate) {
      const slotFilter = (where as { slot?: { venueId?: string; startTime?: { gte?: Date; lte?: Date } } }).slot || {};
      const startTimeFilter: { gte?: Date; lte?: Date } = {};

      if (startDate) {
        startTimeFilter.gte = new Date(startDate);
      }

      if (endDate) {
        startTimeFilter.lte = new Date(endDate);
      }

      (where as { slot?: { venueId?: string; startTime?: { gte?: Date; lte?: Date } } }).slot = {
        ...slotFilter,
        startTime: startTimeFilter,
      };
    }

    // Подсчет общего количества
    const total = await prisma.booking.count({ where });

    // Получение бронирований с пагинацией
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                type: true,
                pricePerHour: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Форматирование ответа
    const formattedBookings: BookingResponse[] = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      slotId: booking.slotId,
      user: booking.user,
      slot: {
        id: booking.slot.id,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        status: booking.slot.status,
        venue: booking.slot.venue,
      },
      status: booking.status,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      refundAmount: booking.refundAmount || undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    return {
      bookings: formattedBookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получить бронирование по ID
   */
  async getBookingById(id: string, requestUserId: string, isAdmin: boolean): Promise<BookingResponse> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                type: true,
                pricePerHour: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    // Проверка прав доступа
    if (!isAdmin && booking.userId !== requestUserId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only view your own bookings');
    }

    return {
      id: booking.id,
      userId: booking.userId,
      slotId: booking.slotId,
      user: booking.user,
      slot: {
        id: booking.slot.id,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        status: booking.slot.status,
        venue: booking.slot.venue,
      },
      status: booking.status,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      refundAmount: booking.refundAmount || undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  /**
   * Проверить доступность слота
   */
  async checkSlotAvailability(slotId: string): Promise<SlotAvailability> {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        bookings: {
          where: {
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
          },
        },
      },
    });

    if (!slot) {
      return {
        available: false,
        reason: 'Slot not found',
      };
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      return {
        available: false,
        reason: `Slot is ${slot.status.toLowerCase()}`,
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
      };
    }

    if (slot.bookings.length > 0) {
      return {
        available: false,
        reason: 'Slot already has an active booking',
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
      };
    }

    // Проверка что слот в будущем
    const slotStartDate = new Date(slot.startTime);
    if (slotStartDate < new Date()) {
      return {
        available: false,
        reason: 'Cannot book a past slot',
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
      };
    }

    return {
      available: true,
      slot: {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      },
    };
  }

  /**
   * Создать новое бронирование
   */
  async createBooking(data: CreateBookingInput, userId: string): Promise<BookingResponse> {
    // Проверка доступности слота
    const availability = await this.checkSlotAvailability(data.slotId);

    if (!availability.available) {
      throw new AppError(409, 'CONFLICT', availability.reason || 'Slot is not available');
    }

    // Получение слота для расчета цены
    const slot = await prisma.slot.findUnique({
      where: { id: data.slotId },
      include: {
        venue: true,
      },
    });

    if (!slot) {
      throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    }

    // Расчёт стоимости
    const totalPrice = this.calculatePrice(
      slot.startTime, 
      slot.endTime, 
      slot.venue.pricePerHour
    );

    // Создание бронирования в транзакции
    const booking = await prisma.$transaction(async (tx) => {
      // Обновление статуса слота
      await tx.slot.update({
        where: { id: data.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      // Создание бронирования
      return tx.booking.create({
        data: {
          userId,
          slotId: data.slotId,
          totalPrice,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          slot: {
            include: {
              venue: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  pricePerHour: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      id: booking.id,
      userId: booking.userId,
      slotId: booking.slotId,
      user: booking.user,
      slot: {
        id: booking.slot.id,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        status: booking.slot.status,
        venue: booking.slot.venue,
      },
      status: booking.status,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  /**
   * Отменить бронирование
   */
  async cancelBooking(id: string, userId: string, isAdmin: boolean): Promise<BookingResponse> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            venue: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    // Проверка прав доступа
    if (!isAdmin && booking.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own bookings');
    }

    // Проверка статуса
    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError(400, 'INVALID_STATUS', 'Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new AppError(400, 'INVALID_STATUS', 'Cannot cancel a completed booking');
    }

    // Расчёт возврата средств
    const refundInfo = this.calculateRefund(
      new Date(booking.slot.startTime), 
      booking.totalPrice
    );

    // Обновление бронирования в транзакции
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Освобождение слота
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // Обновление бронирования
      return tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          refundAmount: refundInfo.amount,
          paymentStatus: refundInfo.amount > 0 ? PaymentStatus.REFUNDED : booking.paymentStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          slot: {
            include: {
              venue: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  pricePerHour: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      slotId: updatedBooking.slotId,
      user: updatedBooking.user,
      slot: {
        id: updatedBooking.slot.id,
        startTime: updatedBooking.slot.startTime,
        endTime: updatedBooking.slot.endTime,
        status: updatedBooking.slot.status,
        venue: updatedBooking.slot.venue,
      },
      status: updatedBooking.status,
      totalPrice: updatedBooking.totalPrice,
      paymentStatus: updatedBooking.paymentStatus,
      refundAmount: updatedBooking.refundAmount || undefined,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };
  }

  /**
   * Обновить статус бронирования (только админ)
   */
  async updateBookingStatus(id: string, data: UpdateBookingStatusInput): Promise<BookingResponse> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    // Обновление статуса
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: data.status,
        // Если бронирование подтверждено, обновить статус оплаты
        ...(data.status === BookingStatus.CONFIRMED && {
          paymentStatus: PaymentStatus.PAID,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                type: true,
                pricePerHour: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      slotId: updatedBooking.slotId,
      user: updatedBooking.user,
      slot: {
        id: updatedBooking.slot.id,
        startTime: updatedBooking.slot.startTime,
        endTime: updatedBooking.slot.endTime,
        status: updatedBooking.slot.status,
        venue: updatedBooking.slot.venue,
      },
      status: updatedBooking.status,
      totalPrice: updatedBooking.totalPrice,
      paymentStatus: updatedBooking.paymentStatus,
      refundAmount: updatedBooking.refundAmount || undefined,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };
  }

  /**
   * Расчёт стоимости бронирования
   */
  private calculatePrice(startTime: Date | string, endTime: Date | string, pricePerHour: number): number {
    // Если startTime и endTime - строки формата "HH:mm", парсим их
    let startHours = 0;
    let startMinutes = 0;
    let endHours = 0;
    let endMinutes = 0;

    if (typeof startTime === 'string') {
      const [hours, minutes] = startTime.split(':').map(Number);
      startHours = hours;
      startMinutes = minutes;
    } else {
      startHours = startTime.getHours();
      startMinutes = startTime.getMinutes();
    }

    if (typeof endTime === 'string') {
      const [hours, minutes] = endTime.split(':').map(Number);
      endHours = hours;
      endMinutes = minutes;
    } else {
      endHours = endTime.getHours();
      endMinutes = endTime.getMinutes();
    }

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;

    return Math.round(durationHours * pricePerHour * 100) / 100; // Округление до 2 знаков
  }

  /**
   * Расчёт возврата средств при отмене
   * Правила:
   * - Более 24 часов до начала: 100% возврат
   * - 12-24 часа до начала: 50% возврат
   * - Менее 12 часов до начала: 0% возврат
   */
  private calculateRefund(slotStartTime: Date, totalPrice: number): RefundInfo {
    const now = new Date();
    const hoursUntilStart = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let percentage = 0;
    let reason = '';

    if (hoursUntilStart > 24) {
      percentage = 100;
      reason = 'Cancelled more than 24 hours before start';
    } else if (hoursUntilStart >= 12) {
      percentage = 50;
      reason = 'Cancelled 12-24 hours before start';
    } else {
      percentage = 0;
      reason = 'Cancelled less than 12 hours before start';
    }

    const amount = Math.round((totalPrice * percentage) / 100 * 100) / 100;

    return {
      eligible: percentage > 0,
      percentage,
      amount,
      reason,
    };
  }
}

export default new BookingService();
