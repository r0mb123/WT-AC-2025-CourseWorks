import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Получить список отзывов с фильтрацией
 *     description: Возвращает список отзывов с возможностью фильтрации по площадке, пользователю, рейтингу и сортировке
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
 *         name: venueId
 *         schema:
 *           type: string
 *         description: ID площадки для фильтрации
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя для фильтрации
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Минимальный рейтинг
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Максимальный рейтинг
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *         description: Поле для сортировки
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Порядок сортировки
 *     responses:
 *       200:
 *         description: Список отзывов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               reviews:
 *                 - id: "review123"
 *                   venueId: "venue456"
 *                   userId: "user789"
 *                   bookingId: "booking101"
 *                   rating: 5
 *                   comment: "Отличная площадка!"
 *                   createdAt: "2025-12-30T10:00:00Z"
 *                   updatedAt: "2025-12-30T10:00:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 totalPages: 3
 *       400:
 *         description: Неверные параметры запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Неверные параметры фильтрации"
 *               code: "INVALID_PARAMETERS"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при получении списка отзывов"
 *               code: "INTERNAL_ERROR"
 */
router.get('/', reviewController.getReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Получить отзыв по ID
 *     description: Возвращает детальную информацию об отзыве по его идентификатору
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отзыва
 *     responses:
 *       200:
 *         description: Отзыв успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *             example:
 *               id: "review123"
 *               venueId: "venue456"
 *               userId: "user789"
 *               bookingId: "booking101"
 *               rating: 5
 *               comment: "Отличная площадка! Все прошло идеально."
 *               createdAt: "2025-12-30T10:00:00Z"
 *               updatedAt: "2025-12-30T10:00:00Z"
 *       404:
 *         description: Отзыв не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Отзыв не найден"
 *               code: "REVIEW_NOT_FOUND"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при получении отзыва"
 *               code: "INTERNAL_ERROR"
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: Создать новый отзыв
 *     description: Создание отзыва для площадки на основе завершенного бронирования (требуется авторизация)
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
 *               - bookingId
 *               - rating
 *             properties:
 *               venueId:
 *                 type: string
 *                 description: ID площадки
 *               bookingId:
 *                 type: string
 *                 description: ID завершенного бронирования
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Рейтинг от 1 до 5
 *               comment:
 *                 type: string
 *                 description: Текст отзыва
 *           example:
 *             venueId: "venue456"
 *             bookingId: "booking101"
 *             rating: 5
 *             comment: "Отличная площадка! Все прошло идеально."
 *     responses:
 *       200:
 *         description: Отзыв успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *             example:
 *               id: "review123"
 *               venueId: "venue456"
 *               userId: "user789"
 *               bookingId: "booking101"
 *               rating: 5
 *               comment: "Отличная площадка! Все прошло идеально."
 *               createdAt: "2025-12-31T12:00:00Z"
 *               updatedAt: "2025-12-31T12:00:00Z"
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Бронирование не завершено или отзыв уже существует"
 *               code: "INVALID_REQUEST"
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Требуется авторизация"
 *               code: "UNAUTHORIZED"
 *       404:
 *         description: Бронирование или площадка не найдены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Бронирование не найдено"
 *               code: "BOOKING_NOT_FOUND"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при создании отзыва"
 *               code: "INTERNAL_ERROR"
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     tags:
 *       - Reviews
 *     summary: Обновить отзыв
 *     description: Обновление существующего отзыва (доступно автору или администратору)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отзыва
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Новый рейтинг от 1 до 5
 *               comment:
 *                 type: string
 *                 description: Новый текст отзыва
 *           example:
 *             rating: 4
 *             comment: "Хорошая площадка, но есть небольшие недочеты."
 *     responses:
 *       200:
 *         description: Отзыв успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *             example:
 *               id: "review123"
 *               venueId: "venue456"
 *               userId: "user789"
 *               bookingId: "booking101"
 *               rating: 4
 *               comment: "Хорошая площадка, но есть небольшие недочеты."
 *               createdAt: "2025-12-30T10:00:00Z"
 *               updatedAt: "2025-12-31T12:30:00Z"
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Неверный формат данных"
 *               code: "INVALID_DATA"
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Требуется авторизация"
 *               code: "UNAUTHORIZED"
 *       404:
 *         description: Отзыв не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Отзыв не найден"
 *               code: "REVIEW_NOT_FOUND"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при обновлении отзыва"
 *               code: "INTERNAL_ERROR"
 */
router.put('/:id', authenticate, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     tags:
 *       - Reviews
 *     summary: Удалить отзыв
 *     description: Удаление отзыва (доступно автору, владельцу площадки или администратору)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отзыва
 *     responses:
 *       200:
 *         description: Отзыв успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Отзыв успешно удален"
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Требуется авторизация"
 *               code: "UNAUTHORIZED"
 *       404:
 *         description: Отзыв не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Отзыв не найден"
 *               code: "REVIEW_NOT_FOUND"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при удалении отзыва"
 *               code: "INTERNAL_ERROR"
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/venue/{venueId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Получить отзывы площадки
 *     description: Возвращает все отзывы для конкретной площадки с пагинацией
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID площадки
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
 *         description: Отзывы площадки успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               reviews:
 *                 - id: "review123"
 *                   venueId: "venue456"
 *                   userId: "user789"
 *                   bookingId: "booking101"
 *                   rating: 5
 *                   comment: "Отличная площадка!"
 *                   createdAt: "2025-12-30T10:00:00Z"
 *                   updatedAt: "2025-12-30T10:00:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 42
 *                 totalPages: 5
 *       400:
 *         description: Неверные параметры запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Неверный ID площадки"
 *               code: "INVALID_VENUE_ID"
 *       404:
 *         description: Площадка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Площадка не найдена"
 *               code: "VENUE_NOT_FOUND"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Ошибка при получении отзывов площадки"
 *               code: "INTERNAL_ERROR"
 */
router.get('/stats/:venueId', reviewController.getReviewStats);

export default router;
