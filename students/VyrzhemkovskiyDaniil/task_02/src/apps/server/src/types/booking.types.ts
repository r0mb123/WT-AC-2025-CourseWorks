import { z } from 'zod';
import { BookingStatus, PaymentStatus } from '@prisma/client';

/**
 * Схема для создания бронирования
 */
export const CreateBookingSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID format'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

/**
 * Схема для обновления статуса бронирования
 */
export const UpdateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

/**
 * Схема для фильтрации бронирований
 */
export const GetBookingsQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  venueId: z.string().uuid('Invalid venue ID format').optional(),
  slotId: z.string().uuid('Invalid slot ID format').optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  startDate: z.string().datetime('Invalid datetime format').optional(),
  endDate: z.string().datetime('Invalid datetime format').optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Схема для отмены бронирования
 */
export const CancelBookingSchema = z.object({
  reason: z.string().max(500, 'Cancellation reason cannot exceed 500 characters').optional(),
});

/**
 * Типы для TypeScript
 */
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
export type GetBookingsQuery = z.infer<typeof GetBookingsQuerySchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

/**
 * Тип для ответа с бронированием
 */
export interface BookingResponse {
  id: string;
  userId: string;
  slotId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    venue?: {
      id: string;
      name: string;
      type: string;
      pricePerHour: number;
    };
  };
  status: BookingStatus;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Тип для списка бронирований с пагинацией
 */
export interface BookingsListResponse {
  bookings: BookingResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Тип для информации о возврате средств
 */
export interface RefundInfo {
  eligible: boolean;
  percentage: number;
  amount: number;
  reason: string;
}

/**
 * Тип для проверки доступности слота
 */
export interface SlotAvailability {
  available: boolean;
  reason?: string;
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}
