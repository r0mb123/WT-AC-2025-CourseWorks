import { Router } from 'express';
import slotController from '../controllers/slot.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/slots:
 *   get:
 *     tags: [Slots]
 *     summary: Получить список слотов
 *     description: Получить список слотов с возможностью фильтрации по площадке, дате, статусу и другим параметрам
 *     parameters:
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: ID площадки для фильтрации
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата для фильтрации (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, CANCELLED]
 *         description: Статус слота
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
 *     responses:
 *       200:
 *         description: Список слотов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Slot'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Неверные параметры запроса
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
router.get('/', slotController.getSlots);

/**
 * @swagger
 * /api/slots/{id}:
 *   get:
 *     tags: [Slots]
 *     summary: Получить слот по ID
 *     description: Получить детальную информацию о слоте по его уникальному идентификатору
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор слота
 *     responses:
 *       200:
 *         description: Слот успешно найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Slot'
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
router.get('/:id', slotController.getSlotById);

/**
 * @swagger
 * /api/slots:
 *   post:
 *     tags: [Slots]
 *     summary: Создать новый слот
 *     description: Создать новый временной слот для площадки (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueId
 *               - startTime
 *               - endTime
 *               - price
 *             properties:
 *               venueId:
 *                 type: string
 *                 description: ID площадки
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Время начала слота
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Время окончания слота
 *               price:
 *                 type: number
 *                 description: Стоимость слота
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BOOKED, CANCELLED]
 *                 default: AVAILABLE
 *                 description: Статус слота
 *           examples:
 *             createSlot:
 *               summary: Пример создания слота
 *               value:
 *                 venueId: "cm5a9l0td0003p81g8b8a7b8c"
 *                 startTime: "2025-12-31T10:00:00Z"
 *                 endTime: "2025-12-31T11:00:00Z"
 *                 price: 1500
 *                 status: "AVAILABLE"
 *     responses:
 *       200:
 *         description: Слот успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Slot'
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
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
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  slotController.createSlot
);

/**
 * @swagger
 * /api/slots/bulk:
 *   post:
 *     tags: [Slots]
 *     summary: Массовое создание слотов
 *     description: Создать несколько временных слотов одновременно (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueId
 *               - startDate
 *               - endDate
 *               - startTime
 *               - endTime
 *               - duration
 *               - price
 *             properties:
 *               venueId:
 *                 type: string
 *                 description: ID площадки
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Дата начала периода
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Дата окончания периода
 *               startTime:
 *                 type: string
 *                 description: Время начала рабочего дня (HH:mm)
 *               endTime:
 *                 type: string
 *                 description: Время окончания рабочего дня (HH:mm)
 *               duration:
 *                 type: integer
 *                 description: Длительность слота в минутах
 *               price:
 *                 type: number
 *                 description: Стоимость одного слота
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 6
 *                 description: Дни недели (0 = воскресенье, 6 = суббота)
 *           examples:
 *             createBulkSlots:
 *               summary: Пример массового создания слотов
 *               value:
 *                 venueId: "cm5a9l0td0003p81g8b8a7b8c"
 *                 startDate: "2025-01-01"
 *                 endDate: "2025-01-31"
 *                 startTime: "09:00"
 *                 endTime: "21:00"
 *                 duration: 60
 *                 price: 1500
 *                 daysOfWeek: [1, 2, 3, 4, 5]
 *     responses:
 *       200:
 *         description: Слоты успешно созданы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Количество созданных слотов
 *                 slots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Slot'
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
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
router.post(
  '/bulk',
  authenticate,
  authorize(Role.ADMIN),
  slotController.createBulkSlots
);

/**
 * @swagger
 * /api/slots/{id}:
 *   put:
 *     tags: [Slots]
 *     summary: Обновить слот
 *     description: Обновить информацию о существующем слоте (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор слота
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Время начала слота
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Время окончания слота
 *               price:
 *                 type: number
 *                 description: Стоимость слота
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BOOKED, CANCELLED]
 *                 description: Статус слота
 *           examples:
 *             updateSlot:
 *               summary: Пример обновления слота
 *               value:
 *                 price: 2000
 *                 status: "AVAILABLE"
 *     responses:
 *       200:
 *         description: Слот успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Slot'
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
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
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  slotController.updateSlot
);

/**
 * @swagger
 * /api/slots/{id}:
 *   delete:
 *     tags: [Slots]
 *     summary: Удалить слот
 *     description: Удалить слот из системы (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор слота
 *     responses:
 *       200:
 *         description: Слот успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Слот успешно удален"
 *       401:
 *         description: Не авторизован
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
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  slotController.deleteSlot
);

export default router;
