import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sports Venues API',
      version: '1.0.0',
      description: 'Полнофункциональная платформа для бронирования спортивных площадок',
      contact: {
        name: 'API Support',
        email: 'support@sports-venues.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.sports-venues.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Аутентификация и авторизация пользователей',
      },
      {
        name: 'Venues',
        description: 'Управление спортивными площадками',
      },
      {
        name: 'Slots',
        description: 'Временные слоты для бронирования',
      },
      {
        name: 'Bookings',
        description: 'Бронирования площадок',
      },
      {
        name: 'Reviews',
        description: 'Отзывы пользователей о площадках',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен для авторизации (получается при логине)',
        },
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Уникальный идентификатор пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            name: {
              type: 'string',
              description: 'Имя пользователя',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'Роль пользователя',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Номер телефона',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания аккаунта',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления',
            },
          },
        },
        // Venue Schema
        Venue: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Название площадки',
            },
            description: {
              type: 'string',
              description: 'Описание площадки',
            },
            address: {
              type: 'string',
              description: 'Адрес площадки',
            },
            sportType: {
              type: 'string',
              enum: ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'VOLLEYBALL', 'BADMINTON', 'TABLE_TENNIS', 'HOCKEY', 'OTHER'],
              description: 'Тип спорта',
            },
            capacity: {
              type: 'integer',
              description: 'Вместимость площадки',
            },
            pricePerHour: {
              type: 'number',
              format: 'decimal',
              description: 'Цена за час (BYN)',
            },
            imageUrl: {
              type: 'string',
              nullable: true,
              description: 'URL изображения площадки',
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Удобства (душ, раздевалка, парковка и т.д.)',
            },
            isActive: {
              type: 'boolean',
              description: 'Активна ли площадка',
            },
            averageRating: {
              type: 'number',
              format: 'float',
              nullable: true,
              description: 'Средний рейтинг (1-5)',
            },
            reviewCount: {
              type: 'integer',
              description: 'Количество отзывов',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Slot Schema
        Slot: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            venueId: {
              type: 'string',
              format: 'uuid',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Дата слота (YYYY-MM-DD)',
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Время начала (HH:MM)',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Время окончания (HH:MM)',
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'BOOKED', 'BLOCKED'],
              description: 'Статус слота',
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Цена слота (BYN)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Booking Schema
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            slotId: {
              type: 'string',
              format: 'uuid',
            },
            venueId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
              description: 'Статус бронирования',
            },
            totalPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Общая стоимость (BYN)',
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
              description: 'Статус оплаты',
            },
            paymentMethod: {
              type: 'string',
              nullable: true,
              description: 'Способ оплаты',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Примечания к бронированию',
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Дата отмены',
            },
            cancellationReason: {
              type: 'string',
              nullable: true,
              description: 'Причина отмены',
            },
            refundAmount: {
              type: 'number',
              format: 'decimal',
              nullable: true,
              description: 'Сумма возврата (BYN)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Review Schema
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            venueId: {
              type: 'string',
              format: 'uuid',
            },
            bookingId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Рейтинг (1-5 звезд)',
            },
            comment: {
              type: 'string',
              description: 'Текст отзыва',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Pagination Schema
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Текущая страница',
            },
            limit: {
              type: 'integer',
              description: 'Количество элементов на странице',
            },
            total: {
              type: 'integer',
              description: 'Общее количество элементов',
            },
            totalPages: {
              type: 'integer',
              description: 'Общее количество страниц',
            },
          },
        },
        // Error Schema
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts', // Development
    './dist/routes/*.js', // Production
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
