import { SlotStatus } from '@prisma/client';
import prisma from '../utils/prisma.util';
import { AppError } from '../middleware/error.middleware';
import {
  CreateSlotInput,
  UpdateSlotInput,
  GetSlotsQuery,
  CreateBulkSlotsInput,
  SlotResponse,
  SlotsListResponse,
} from '../types/slot.types';

/**
 * Сервис для управления временными слотами
 */
class SlotService {
  /**
   * Получить список слотов с фильтрацией
   */
  async getSlots(query: GetSlotsQuery): Promise<SlotsListResponse> {
    const { venueId, date, startDate, endDate, status, page = 1, limit = 50 } = query;

    // Построение фильтров
    const where: any = {};

    if (venueId) {
      where.venueId = venueId;
    }

    if (status) {
      where.status = status;
    }

    // Фильтр по дате или диапазону дат
    if (date) {
      // Используем поле date (DATE type), а не startTime (TEXT type)
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(startDate);
      }

      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Подсчет общего количества
    const total = await prisma.slot.count({ where });

    // Получение слотов с пагинацией
    const slots = await prisma.slot.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Форматирование ответа
    const formattedSlots: SlotResponse[] = slots.map((slot) => ({
      id: slot.id,
      venueId: slot.venueId,
      venue: slot.venue,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      isBooked: slot.bookings.some((b) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));

    return {
      slots: formattedSlots,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получить слот по ID
   */
  async getSlotById(id: string): Promise<SlotResponse> {
    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!slot) {
      throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    }

    return {
      id: slot.id,
      venueId: slot.venueId,
      venue: slot.venue,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      isBooked: slot.bookings.some((b) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  /**
   * Создать новый слот
   */
  async createSlot(data: CreateSlotInput, userId: string): Promise<SlotResponse> {
    // Проверка существования площадки
    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
    });

    if (!venue) {
      throw new AppError(404, 'NOT_FOUND', 'Venue not found');
    }

    // Проверка прав: только админ
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admin can create slots');
    }

    // Проверка пересечения с существующими слотами
    await this.checkSlotOverlap(data.venueId, new Date(data.startTime), new Date(data.endTime));

    // Создание слота
    const slot = await prisma.slot.create({
      data: {
        venueId: data.venueId,
        date: new Date(data.startTime),
        startTime: new Date(data.startTime).toTimeString().slice(0, 5),
        endTime: new Date(data.endTime).toTimeString().slice(0, 5),
        status: data.status || SlotStatus.AVAILABLE,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return {
      id: slot.id,
      venueId: slot.venueId,
      venue: slot.venue,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      isBooked: false,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  /**
   * Массовое создание слотов
   */
  async createBulkSlots(data: CreateBulkSlotsInput, userId: string): Promise<{ created: number; slots: SlotResponse[] }> {
    // Проверка существования площадки
    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
    });

    if (!venue) {
      throw new AppError(404, 'NOT_FOUND', 'Venue not found');
    }

    // Проверка прав
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admin can create slots');
    }

    const slotsToCreate: any[] = [];

    // Генерация слотов для каждой даты и временного интервала
    for (const dateStr of data.dates) {
      for (const timeSlot of data.timeSlots) {
        const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);

        const startTime = new Date(dateStr);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(dateStr);
        endTime.setHours(endHour, endMinute, 0, 0);

        // Если endTime меньше startTime, значит слот переходит на следующий день
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }

        slotsToCreate.push({
          venueId: data.venueId,
          date: new Date(dateStr),
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          status: data.status || SlotStatus.AVAILABLE,
        });
      }
    }

    // Создание слотов
    const createPromises = slotsToCreate.map(async (slotData) => {
      // Проверка пересечения
      const [startHour, startMin] = slotData.startTime.split(':').map(Number);
      const [endHour, endMin] = slotData.endTime.split(':').map(Number);
      
      const startDate = new Date(slotData.date);
      startDate.setHours(startHour, startMin, 0, 0);
      
      const endDate = new Date(slotData.date);
      endDate.setHours(endHour, endMin, 0, 0);
      
      const hasOverlap = await this.hasSlotOverlap(
        slotData.venueId,
        startDate,
        endDate
      );

      if (!hasOverlap) {
        return prisma.slot.create({
          data: slotData,
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        });
      }
      return null;
    });

    const results = await Promise.all(createPromises);
    const createdSlots = results.filter((slot) => slot !== null);

    const formattedSlots: SlotResponse[] = createdSlots.map((slot: any) => ({
      id: slot.id,
      venueId: slot.venueId,
      venue: slot.venue,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      isBooked: false,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));

    return {
      created: createdSlots.length,
      slots: formattedSlots,
    };
  }

  /**
   * Обновить слот
   */
  async updateSlot(id: string, data: UpdateSlotInput, userId: string): Promise<SlotResponse> {
    // Получение слота
    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        venue: true,
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
      },
    });

    if (!slot) {
      throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    }

    // Проверка прав
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admin can update slots');
    }

    // Проверка: нельзя изменять забронированный слот
    if (slot.bookings.length > 0 && (data.startTime || data.endTime)) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot modify time of a booked slot');
    }

    // Проверка пересечения при изменении времени
    if (data.startTime || data.endTime) {
      // Для проверки пересечения нужны полные даты
      const currentDate = slot.date;
      const [currentStartHour, currentStartMin] = slot.startTime.split(':').map(Number);
      const [currentEndHour, currentEndMin] = slot.endTime.split(':').map(Number);
      
      const currentStartDate = new Date(currentDate);
      currentStartDate.setHours(currentStartHour, currentStartMin, 0, 0);
      
      const currentEndDate = new Date(currentDate);
      currentEndDate.setHours(currentEndHour, currentEndMin, 0, 0);
      
      const newStartTime = data.startTime ? new Date(data.startTime) : currentStartDate;
      const newEndTime = data.endTime ? new Date(data.endTime) : currentEndDate;

      await this.checkSlotOverlap(slot.venueId, newStartTime, newEndTime, id);
    }

    // Обновление слота
    const updateData: any = {};
    if (data.startTime) {
      const startDate = new Date(data.startTime);
      updateData.date = startDate;
      updateData.startTime = startDate.toTimeString().slice(0, 5);
    }
    if (data.endTime) {
      const endDate = new Date(data.endTime);
      updateData.endTime = endDate.toTimeString().slice(0, 5);
    }
    if (data.status) {
      updateData.status = data.status;
    }

    const updatedSlot = await prisma.slot.update({
      where: { id },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return {
      id: updatedSlot.id,
      venueId: updatedSlot.venueId,
      venue: updatedSlot.venue,
      startTime: updatedSlot.startTime,
      endTime: updatedSlot.endTime,
      status: updatedSlot.status,
      isBooked: updatedSlot.bookings.some((b) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
      createdAt: updatedSlot.createdAt,
      updatedAt: updatedSlot.updatedAt,
    };
  }

  /**
   * Удалить слот
   */
  async deleteSlot(id: string, userId: string): Promise<void> {
    // Получение слота
    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        venue: true,
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
      },
    });

    if (!slot) {
      throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    }

    // Проверка прав
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only admin can delete slots');
    }

    // Проверка: нельзя удалять забронированный слот
    if (slot.bookings.length > 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot delete a booked slot');
    }

    // Удаление слота
    await prisma.slot.delete({
      where: { id },
    });
  }

  /**
   * Проверка пересечения слотов
   */
  private async checkSlotOverlap(
    venueId: string,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: string
  ): Promise<void> {
    const hasOverlap = await this.hasSlotOverlap(venueId, startTime, endTime, excludeSlotId);

    if (hasOverlap) {
      throw new AppError(409, 'CONFLICT', 'Time slot overlaps with existing slot');
    }
  }

  /**
   * Проверка наличия пересечения слотов (без выброса ошибки)
   */
  private async hasSlotOverlap(
    venueId: string,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: string
  ): Promise<boolean> {
    // Получаем дату и время отдельно
    const date = new Date(startTime);
    date.setHours(0, 0, 0, 0);
    
    const startTimeStr = startTime.toTimeString().slice(0, 5);
    const endTimeStr = endTime.toTimeString().slice(0, 5);
    
    // Ищем слоты на эту же дату
    const slotsOnDate = await prisma.slot.findMany({
      where: {
        venueId,
        date,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
    });

    // Проверяем пересечение по времени
    for (const slot of slotsOnDate) {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      
      // Проверка пересечения интервалов времени
      if (
        (startTimeStr < slotEnd && endTimeStr > slotStart) || // Пересечение
        (startTimeStr <= slotStart && endTimeStr >= slotEnd)   // Полное покрытие
      ) {
        return true;
      }
    }

    return false;
  }
}

export default new SlotService();
