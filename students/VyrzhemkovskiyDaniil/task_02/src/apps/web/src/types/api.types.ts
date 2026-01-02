/**
 * API Types
 * 
 * Типы данных для взаимодействия с Backend API
 */

// ============================================
// COMMON TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// USER & AUTH TYPES
// ============================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// VENUE TYPES
// ============================================

export enum VenueType {
  FOOTBALL = 'FOOTBALL',
  BASKETBALL = 'BASKETBALL',
  TENNIS = 'TENNIS',
  VOLLEYBALL = 'VOLLEYBALL',
  BADMINTON = 'BADMINTON',
  FUTSAL = 'FUTSAL',
  HOCKEY = 'HOCKEY',
  OTHER = 'OTHER',
}

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  address: string;
  description?: string;
  pricePerHour: number;
  imageUrl?: string;
  amenities?: string[];
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VenueFilters extends PaginationParams {
  type?: VenueType;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

export interface CreateVenueRequest {
  name: string;
  type: VenueType;
  address: string;
  description?: string;
  pricePerHour: number;
  imageUrl?: string;
  amenities?: string[];
}

export type UpdateVenueRequest = Partial<CreateVenueRequest>;

// ============================================
// SLOT TYPES
// ============================================

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export interface Slot {
  id: string;
  venueId: string;
  venue?: {
    id: string;
    name: string;
    type: VenueType;
    pricePerHour: number;
  };
  startTime: string;
  endTime: string;
  status: SlotStatus;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlotFilters extends PaginationParams {
  venueId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: SlotStatus;
}

export interface CreateSlotRequest {
  venueId: string;
  startTime: string;
  endTime: string;
  status?: SlotStatus;
}

export interface BulkCreateSlotsRequest {
  venueId: string;
  dates: string[]; // ['2025-01-05', '2025-01-06']
  timeSlots: Array<{
    startTime: string; // '09:00'
    endTime: string; // '11:00'
  }>;
  status?: SlotStatus;
}

export interface BulkCreateSlotsResponse {
  message: string;
  created: number;
  slots: Slot[];
}

// ============================================
// BOOKING TYPES
// ============================================

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export interface Booking {
  id: string;
  userId: string;
  slotId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    venue: {
      id: string;
      name: string;
      type: VenueType;
      pricePerHour: number;
      address: string;
    };
  };
  status: BookingStatus;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters extends PaginationParams {
  userId?: string;
  venueId?: string;
  slotId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateBookingRequest {
  slotId: string;
  notes?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}

export interface CheckSlotAvailabilityResponse {
  available: boolean;
  reason?: string;
  slot: Slot;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  user?: {
    id: string;
    name: string;
  };
  venue?: {
    id: string;
    name: string;
    type: VenueType;
  };
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters extends PaginationParams {
  venueId?: string;
  userId?: string;
  rating?: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewRequest {
  venueId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}
