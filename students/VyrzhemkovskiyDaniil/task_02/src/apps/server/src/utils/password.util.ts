import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Хэширует пароль с использованием bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Сравнивает пароль с хэшем
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
