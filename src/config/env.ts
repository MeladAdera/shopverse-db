// src/config/env.ts - نسخة أكثر مرونة
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  HOST: z.string().default('localhost'),
  
  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // JWT Secrets - جعلها optional للتطوير مع قيم افتراضية
  JWT_SECRET: z.string().default('fallback-dev-jwt-secret-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('fallback-dev-refresh-secret-change-in-production'),
  
  // Database (سيتم إضافتها لاحقاً)
  DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;