import prisma from '../utils/prisma.util';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';
import { RegisterInput, LoginInput } from '../types/auth.types';
import { Role } from '@prisma/client';

export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterInput) {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'EMAIL_EXISTS', 'User with this email already exists');
    }

    // Хэшируем пароль
    const hashedPassword = await hashPassword(data.password);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return { user };
  }

  /**
   * Вход пользователя
   */
  async login(data: LoginInput) {
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Генерируем токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  /**
   * Получение данных текущего пользователя
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  }

  /**
   * Обновление профиля пользователя
   */
  async updateProfile(userId: string, data: { name?: string; phone?: string; email?: string }) {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Если меняется email, проверяем уникальность
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new AppError(409, 'EMAIL_EXISTS', 'User with this email already exists');
      }
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Смена пароля пользователя
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Находим пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Проверяем текущий пароль
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    // Хэшируем новый пароль
    const hashedPassword = await hashPassword(newPassword);

    // Обновляем пароль
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password successfully changed' };
  }
}
