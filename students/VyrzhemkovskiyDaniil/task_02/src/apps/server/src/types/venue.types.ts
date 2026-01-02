import { z } from 'zod';
import { VenueType } from '@prisma/client';

export const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.nativeEnum(VenueType),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    description: z.string().optional(),
    pricePerHour: z.number().positive('Price must be positive'),
    imageUrl: z.string().url('Invalid URL').optional(),
    amenities: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  }),
});

export const updateVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    type: z.nativeEnum(VenueType).optional(),
    address: z.string().min(5).optional(),
    description: z.string().optional(),
    pricePerHour: z.number().positive().optional(),
    imageUrl: z.string().url().optional(),
    amenities: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid venue ID'),
  }),
});

export const getVenueSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid venue ID'),
  }),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>['body'];
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>['body'];
