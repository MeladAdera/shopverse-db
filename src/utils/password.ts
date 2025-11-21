// src/utils/password.ts
import bcrypt from 'bcryptjs';

/**
 * تشفير كلمة المرور
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // عدد مرات التشفير (أعلى = أكثر أماناً ولكن أبطئ)
  return await bcrypt.hash(password, saltRounds);
};

/**
 * التحقق من كلمة المرور
 */
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * التحقق من قوة كلمة المرور
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
};