import { Router } from 'express';
import authRoutes from './auth.routes';
import venueRoutes from './venue.routes';
import slotRoutes from './slot.routes';
import bookingRoutes from './booking.routes';
import reviewRoutes from './review.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/venues', venueRoutes);
router.use('/slots', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);

// API info
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Sports Venues API v1.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      venues: {
        list: 'GET /api/venues',
        get: 'GET /api/venues/:id',
        create: 'POST /api/venues (Admin)',
        update: 'PUT /api/venues/:id (Admin)',
        delete: 'DELETE /api/venues/:id (Admin)',
      },
      slots: 'Coming soon...',
      bookings: 'Coming soon...',
      reviews: 'Coming soon...',
      payments: 'Coming soon...',
    },
  });
});

export default router;
