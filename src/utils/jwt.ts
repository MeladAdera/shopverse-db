// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// أنواع التوكن
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * إنشاء Access Token (صالح لمدة قصيرة)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // 15 دقيقة - يمكن تعديلها
    issuer: 'shopverse-api',
    audience: 'shopverse-users',
  });
};

/**
 * إنشاء Refresh Token (صالح لمدة طويلة)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 أيام
    issuer: 'shopverse-api', 
    audience: 'shopverse-users',
  });
};

/**
 * التحقق من Access Token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

/**
 * التحقق من Refresh Token  
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

/**
 * استخراج البيانات من التوكن بدون التحقق (للاستخدام الداخلي فقط)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};