import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/roles.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createVenueSchema,
  updateVenueSchema,
  getVenueSchema,
} from '../types/venue.types';

const router = Router();
const venueController = new VenueController();

/**
 * @swagger
 * /api/venues:
 *   get:
 *     tags:
 *       - Venues
 *     summary: Получение списка площадок
 *     description: Возвращает список спортивных площадок с возможностью фильтрации и пагинации
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
 *         name: sportType
 *         schema:
 *           type: string
 *           enum: [football, basketball, tennis, volleyball, other]
 *         description: Фильтр по виду спорта
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Минимальная цена за час
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Максимальная цена за час
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию или адресу
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Фильтр по городу
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Показать только активные площадки
 *     responses:
 *       200:
 *         description: Список площадок успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Venue'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Некорректные параметры запроса
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
router.get('/', venueController.getVenues.bind(venueController));

/**
 * @swagger
 * /api/venues/{id}:
 *   get:
 *     tags:
 *       - Venues
 *     summary: Получение информации о площадке
 *     description: Возвращает подробную информацию о конкретной спортивной площадке по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID площадки
 *     responses:
 *       200:
 *         description: Информация о площадке успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       400:
 *         description: Некорректный ID площадки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Площадка не найдена
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
router.get(
  '/:id',
  validate(getVenueSchema),
  venueController.getVenueById.bind(venueController)
);

/**
 * @swagger
 * /api/venues:
 *   post:
 *     tags:
 *       - Venues
 *     summary: Создание новой площадки
 *     description: Создает новую спортивную площадку (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *               - sportType
 *               - pricePerHour
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название площадки
 *                 example: Спортивный комплекс "Олимп"
 *               description:
 *                 type: string
 *                 description: Описание площадки
 *                 example: Современная футбольная площадка с искусственным покрытием
 *               address:
 *                 type: string
 *                 description: Адрес площадки
 *                 example: ул. Спортивная, 10
 *               city:
 *                 type: string
 *                 description: Город
 *                 example: Минск
 *               sportType:
 *                 type: string
 *                 enum: [football, basketball, tennis, volleyball, other]
 *                 description: Вид спорта
 *                 example: football
 *               pricePerHour:
 *                 type: number
 *                 description: Цена за час аренды
 *                 example: 50.00
 *               workingHours:
 *                 type: object
 *                 description: Рабочие часы
 *                 properties:
 *                   start:
 *                     type: string
 *                     example: "08:00"
 *                   end:
 *                     type: string
 *                     example: "22:00"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Удобства
 *                 example: ["Раздевалка", "Душ", "Парковка"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URL изображений
 *                 example: ["https://example.com/image1.jpg"]
 *     responses:
 *       200:
 *         description: Площадка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Требуется авторизация
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
  adminOnly,
  validate(createVenueSchema),
  venueController.createVenue.bind(venueController)
);

/**
 * @swagger
 * /api/venues/{id}:
 *   put:
 *     tags:
 *       - Venues
 *     summary: Обновление информации о площадке
 *     description: Обновляет данные существующей площадки (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID площадки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название площадки
 *                 example: Спортивный комплекс "Олимп"
 *               description:
 *                 type: string
 *                 description: Описание площадки
 *                 example: Обновленное описание площадки
 *               address:
 *                 type: string
 *                 description: Адрес площадки
 *                 example: ул. Спортивная, 10
 *               city:
 *                 type: string
 *                 description: Город
 *                 example: Минск
 *               sportType:
 *                 type: string
 *                 enum: [football, basketball, tennis, volleyball, other]
 *                 description: Вид спорта
 *                 example: football
 *               pricePerHour:
 *                 type: number
 *                 description: Цена за час аренды
 *                 example: 55.00
 *               workingHours:
 *                 type: object
 *                 description: Рабочие часы
 *                 properties:
 *                   start:
 *                     type: string
 *                     example: "08:00"
 *                   end:
 *                     type: string
 *                     example: "23:00"
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Удобства
 *                 example: ["Раздевалка", "Душ", "Парковка", "Wi-Fi"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URL изображений
 *                 example: ["https://example.com/image1.jpg"]
 *               isActive:
 *                 type: boolean
 *                 description: Статус активности площадки
 *                 example: true
 *     responses:
 *       200:
 *         description: Площадка успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Площадка не найдена
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
  adminOnly,
  validate(updateVenueSchema),
  venueController.updateVenue.bind(venueController)
);

/**
 * @swagger
 * /api/venues/{id}:
 *   delete:
 *     tags:
 *       - Venues
 *     summary: Удаление площадки
 *     description: Выполняет мягкое удаление площадки (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID площадки
 *     responses:
 *       200:
 *         description: Площадка успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Площадка успешно удалена
 *       400:
 *         description: Некорректный ID площадки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Площадка не найдена
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
  adminOnly,
  validate(getVenueSchema),
  venueController.deleteVenue.bind(venueController)
);

export default router;
