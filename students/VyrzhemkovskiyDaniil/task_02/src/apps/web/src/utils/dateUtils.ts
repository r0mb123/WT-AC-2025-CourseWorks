/**
 * Date Utilities
 * 
 * Утилиты для работы с датами
 */

import { format, parseISO, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Форматировать дату в читаемый формат
 */
export const formatDate = (date: string | Date | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Форматировать время
 */
export const formatTime = (date: string | Date | undefined): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm');
};

/**
 * Форматировать дату и время
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm');
};

/**
 * Получить массив дат для следующих N дней
 */
export const getNextDays = (count: number, startDate: Date = new Date()): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
};

/**
 * Получить начало дня
 */
export const getStartOfDay = (date: Date): Date => {
  return startOfDay(date);
};

/**
 * Получить конец дня
 */
export const getEndOfDay = (date: Date): Date => {
  return endOfDay(date);
};

/**
 * Конвертировать дату в ISO строку для API
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Рассчитать длительность между двумя датами в часах
 */
export const calculateDurationHours = (start: string | Date, end: string | Date): number => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Получить название дня недели
 */
export const getDayName = (date: Date): string => {
  return format(date, 'EEEE');
};

/**
 * Проверить, прошла ли дата
 */
export const isPastDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
};
