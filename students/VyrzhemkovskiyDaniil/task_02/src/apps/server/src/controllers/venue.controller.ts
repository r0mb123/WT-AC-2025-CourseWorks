import { Request, Response, NextFunction } from 'express';
import { VenueService } from '../services/venue.service';
import { VenueType } from '@prisma/client';

const venueService = new VenueService();

export class VenueController {
  /**
   * GET /api/venues
   * Получить список площадок
   */
  async getVenues(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        type,
        priceMin,
        priceMax,
        search,
        sortBy,
        order,
      } = req.query;

      const result = await venueService.getVenues({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as VenueType,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        order: (order as 'asc' | 'desc') || 'desc',
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/venues/:id
   * Получить детали площадки
   */
  async getVenueById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const venue = await venueService.getVenueById(id);

      res.status(200).json({
        success: true,
        data: venue,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/venues
   * Создать площадку (Admin only)
   */
  async createVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await venueService.createVenue(req.body);

      res.status(201).json({
        success: true,
        data: venue,
        message: 'Venue successfully created',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/venues/:id
   * Обновить площадку (Admin only)
   */
  async updateVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const venue = await venueService.updateVenue(id, req.body);

      res.status(200).json({
        success: true,
        data: venue,
        message: 'Venue successfully updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/venues/:id
   * Удалить площадку (Admin only)
   */
  async deleteVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await venueService.deleteVenue(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
