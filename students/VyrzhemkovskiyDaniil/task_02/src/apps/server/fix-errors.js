// Скрипт для исправления AppError вызовов
// Все вызовы вида: throw new AppError('message', statusCode);
// Нужно заменить на: throw new AppError(statusCode, 'CODE', 'message');

const replacements = {
  // booking.service.ts
  "throw new AppError('Booking not found', 404)": "throw new AppError(404, 'NOT_FOUND', 'Booking not found')",
  "throw new AppError('You can only view your own bookings', 403)": "throw new AppError(403, 'FORBIDDEN', 'You can only view your own bookings')",
  "throw new AppError(availability.reason || 'Slot is not available', 409)": "throw new AppError(409, 'CONFLICT', availability.reason || 'Slot is not available')",
  "throw new AppError('Slot not found', 404)": "throw new AppError(404, 'NOT_FOUND', 'Slot not found')",
  "throw new AppError('You can only cancel your own bookings', 403)": "throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own bookings')",
  "throw new AppError('Booking is already cancelled', 400)": "throw new AppError(400, 'BAD_REQUEST', 'Booking is already cancelled')",
  "throw new AppError('Cannot cancel a completed booking', 400)": "throw new AppError(400, 'BAD_REQUEST', 'Cannot cancel a completed booking')",
  
  // review.service.ts
  "throw new AppError('Review not found', 404)": "throw new AppError(404, 'NOT_FOUND', 'Review not found')",
  "throw new AppError('Venue not found', 404)": "throw new AppError(404, 'NOT_FOUND', 'Venue not found')",
  "throw new AppError('You have already reviewed this venue. You can update your existing review.', 409)": "throw new AppError(409, 'CONFLICT', 'You have already reviewed this venue. You can update your existing review.')",
  "throw new AppError('You must have a completed booking at this venue to leave a review', 403)": "throw new AppError(403, 'FORBIDDEN', 'You must have a completed booking at this venue to leave a review')",
  "throw new AppError('You can only update your own reviews', 403)": "throw new AppError(403, 'FORBIDDEN', 'You can only update your own reviews')",
  "throw new AppError('You can only delete your own reviews or reviews on your venues', 403)": "throw new AppError(403, 'FORBIDDEN', 'You can only delete your own reviews')",
};

// Удалить поля notes и cancellationReason из всех ответов
