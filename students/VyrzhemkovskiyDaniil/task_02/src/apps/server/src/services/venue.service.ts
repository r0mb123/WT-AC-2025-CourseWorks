import prisma from '../utils/prisma.util';
import { AppError } from '../middleware/error.middleware';
import { CreateVenueInput, UpdateVenueInput } from '../types/venue.types';
import { VenueType, Prisma } from '@prisma/client';

interface GetVenuesOptions {
  page?: number;
  limit?: number;
  type?: VenueType;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export class VenueService {
  /**
   * Получить список площадок с фильтрацией и пагинацией
   */
  async getVenues(options: GetVenuesOptions) {
    const {
      page = 1,
      limit = 20,
      type,
      priceMin,
      priceMax,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: Prisma.VenueWhereInput = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.pricePerHour = {};
      if (priceMin !== undefined) {
        where.pricePerHour.gte = priceMin;
      }
      if (priceMax !== undefined) {
        where.pricePerHour.lte = priceMax;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Получение площадок
    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      prisma.venue.count({ where }),
    ]);

    // Добавляем средний рейтинг
    const venuesWithRating = venues.map((venue) => {
      const averageRating =
        venue.reviews.length > 0
          ? venue.reviews.reduce((sum, r) => sum + r.rating, 0) / venue.reviews.length
          : 0;

      const { reviews: _reviews, _count, ...venueData } = venue;

      return {
        ...venueData,
        averageRating: Number(averageRating.toFixed(1)),
        reviewsCount: _count.reviews,
      };
    });

    return {
      venues: venuesWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получить детали площадки
   */
  async getVenueById(id: string) {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!venue) {
      throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
    }

    // Расчёт среднего рейтинга
    const averageRating =
      venue.reviews.length > 0
        ? venue.reviews.reduce((sum, r) => sum + r.rating, 0) / venue.reviews.length
        : 0;

    return {
      ...venue,
      averageRating: Number(averageRating.toFixed(1)),
      reviewsCount: venue._count.reviews,
    };
  }

  /**
   * Создать площадку (Admin)
   */
  async createVenue(data: CreateVenueInput) {
    const venue = await prisma.venue.create({
      data,
    });

    return venue;
  }

  /**
   * Обновить площадку (Admin)
   */
  async updateVenue(id: string, data: UpdateVenueInput) {
    const venue = await prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data,
    });

    return updatedVenue;
  }

  /**
   * Удалить площадку (Admin) - soft delete
   */
  async deleteVenue(id: string) {
    const venue = await prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      throw new AppError(404, 'VENUE_NOT_FOUND', 'Venue not found');
    }

    // Soft delete
    await prisma.venue.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Venue successfully deleted' };
  }
}
