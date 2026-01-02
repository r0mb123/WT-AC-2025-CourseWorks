import { z } from 'zod';
import { SlotStatus } from '@prisma/client';

/**
 * Схема для создания временного слота
 */
export const CreateSlotSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID format'),
  startTime: z.string().datetime('Invalid datetime format'),
  endTime: z.string().datetime('Invalid datetime format'),
  status: z.nativeEnum(SlotStatus).optional().default(SlotStatus.AVAILABLE),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    return duration >= 30 && duration <= 480; // от 30 минут до 8 часов
  },
  {
    message: 'Slot duration must be between 30 minutes and 8 hours',
    path: ['endTime'],
  }
);

/**
 * Схема для обновления временного слота
 */
export const UpdateSlotSchema = z.object({
  startTime: z.string().datetime('Invalid datetime format').optional(),
  endTime: z.string().datetime('Invalid datetime format').optional(),
  status: z.nativeEnum(SlotStatus).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

/**
 * Схема для фильтрации слотов
 */
export const GetSlotsQuerySchema = z.object({
  venueId: z.string().uuid('Invalid venue ID format').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  startDate: z.string().datetime('Invalid datetime format').optional(),
  endDate: z.string().datetime('Invalid datetime format').optional(),
  status: z.nativeEnum(SlotStatus).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
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
 * Схема для массового создания слотов
 */
export const CreateBulkSlotsSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID format'),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')).min(1, 'At least one date required'),
  timeSlots: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  })).min(1, 'At least one time slot required'),
  status: z.nativeEnum(SlotStatus).optional().default(SlotStatus.AVAILABLE),
});

/**
 * Типы для TypeScript
 */
export type CreateSlotInput = z.infer<typeof CreateSlotSchema>;
export type UpdateSlotInput = z.infer<typeof UpdateSlotSchema>;
export type GetSlotsQuery = z.infer<typeof GetSlotsQuerySchema>;
export type CreateBulkSlotsInput = z.infer<typeof CreateBulkSlotsSchema>;

/**
 * Тип для ответа со слотом
 */
export interface SlotResponse {
  id: string;
  venueId: string;
  venue?: {
    id: string;
    name: string;
    type: string;
  };
  startTime: string;
  endTime: string;
  status: SlotStatus;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Тип для списка слотов с пагинацией
 */
export interface SlotsListResponse {
  slots: SlotResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
