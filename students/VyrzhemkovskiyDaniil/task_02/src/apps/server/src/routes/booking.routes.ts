import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Получить список бронирований пользователя
 *     description: Возвращает список всех бронирований текущего пользователя с пагинацией. Администраторы видят все бронирования.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество элементов на странице
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Фильтр по статусу бронирования
 *     responses:
 *       200:
 *         description: Список бронирований успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, bookingController.getBookings);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Создать новое бронирование
 *     description: Создает новое бронирование для указанного временного слота
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *             properties:
 *               slotId:
 *                 type: string
 *                 description: ID временного слота для бронирования
 *               notes:
 *                 type: string
 *                 description: Дополнительные заметки к бронированию
 *           examples:
 *             basic:
 *               summary: Базовое бронирование
 *               value:
 *                 slotId: "clx1234567890abcdefgh"
 *             withNotes:
 *               summary: Бронирование с заметками
 *               value:
 *                 slotId: "clx1234567890abcdefgh"
 *                 notes: "Прошу окно с видом на парк"
 *     responses:
 *       200:
 *         description: Бронирование успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Неверные данные запроса или слот недоступен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               slotUnavailable:
 *                 summary: Слот недоступен
 *                 value:
 *                   message: "Слот недоступен для бронирования"
 *               invalidData:
 *                 summary: Неверные данные
 *                 value:
 *                   message: "Неверный формат данных"
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Слот не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Получить детали бронирования
 *     description: Возвращает полную информацию о бронировании по его ID. Пользователи могут видеть только свои бронирования, администраторы - все.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID бронирования
 *     responses:
 *       200:
 *         description: Детали бронирования успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Бронирование не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, bookingController.getBookingById);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     tags:
 *       - Bookings
 *     summary: Отменить бронирование
 *     description: Отменяет существующее бронирование. Пользователи могут отменять только свои бронирования, администраторы - любые.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID бронирования
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Причина отмены бронирования
 *           examples:
 *             withReason:
 *               summary: Отмена с указанием причины
 *               value:
 *                 reason: "Изменились планы"
 *     responses:
 *       200:
 *         description: Бронирование успешно отменено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Невозможно отменить бронирование (неверный статус)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Бронирование не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     tags:
 *       - Bookings
 *     summary: Удалить бронирование
 *     description: Удаляет бронирование из системы. Доступно только для администраторов.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID бронирования
 *     responses:
 *       200:
 *         description: Бронирование успешно удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Бронирование успешно удалено"
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Бронирование не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/bookings/history:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Получить историю бронирований
 *     description: Возвращает историю всех завершенных и отмененных бронирований пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество элементов на странице
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата периода
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата периода
 *     responses:
 *       200:
 *         description: История бронирований успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/bookings/check/{slotId}:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Проверить доступность слота
 *     description: Проверяет, доступен ли временной слот для бронирования
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID временного слота
 *     responses:
 *       200:
 *         description: Информация о доступности слота
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   description: Доступен ли слот для бронирования
 *                 message:
 *                   type: string
 *                   description: Дополнительная информация
 *       404:
 *         description: Слот не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/check/:slotId', bookingController.checkAvailability);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     tags:
 *       - Bookings
 *     summary: Обновить статус бронирования (только для администраторов)
 *     description: Изменяет статус бронирования. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID бронирования
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                 description: Новый статус бронирования
 *           examples:
 *             confirm:
 *               summary: Подтвердить бронирование
 *               value:
 *                 status: "CONFIRMED"
 *             complete:
 *               summary: Завершить бронирование
 *               value:
 *                 status: "COMPLETED"
 *     responses:
 *       200:
 *         description: Статус бронирования успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Неверный статус
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Бронирование не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id/status',
  authenticate,
  authorize(Role.ADMIN),
  bookingController.updateBookingStatus
);

export default router;
