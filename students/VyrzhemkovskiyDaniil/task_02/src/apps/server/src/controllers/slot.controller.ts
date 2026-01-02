import { Request, Response, NextFunction } from 'express';
import slotService from '../services/slot.service';
import {
  CreateSlotSchema,
  UpdateSlotSchema,
  GetSlotsQuerySchema,
  CreateBulkSlotsSchema,
} from '../types/slot.types';
import { AuthRequest } from '../types/auth.types';

/**
 * Контроллер для управления временными слотами
 */
class SlotController {
  /**
   * Получить список слотов
   * GET /api/slots
   */
  async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = GetSlotsQuerySchema.parse(req.query);
      const result = await slotService.getSlots(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получить слот по ID
   * GET /api/slots/:id
   */
  async getSlotById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const slot = await slotService.getSlotById(id);

      res.json(slot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создать новый слот
   * POST /api/slots
   */
  async createSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateSlotSchema.parse(req.body);
      const userId = req.user!.userId;

      const slot = await slotService.createSlot(data, userId);

      res.status(201).json(slot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Массовое создание слотов
   * POST /api/slots/bulk
   */
  async createBulkSlots(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateBulkSlotsSchema.parse(req.body);
      const userId = req.user!.userId;

      const result = await slotService.createBulkSlots(data, userId);

      res.status(201).json({
        message: `Successfully created ${result.created} slots`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновить слот
   * PUT /api/slots/:id
   */
  async updateSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateSlotSchema.parse(req.body);
      const userId = req.user!.userId;

      const slot = await slotService.updateSlot(id, data, userId);

      res.json(slot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удалить слот
   * DELETE /api/slots/:id
   */
  async deleteSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await slotService.deleteSlot(id, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new SlotController();
