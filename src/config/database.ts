// src/config/database.ts
import { Pool } from 'pg';
import { env } from './env';

// إنشاء connection pool
export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'shopverse',
  user: 'admin', // أو اسم المستخدم الخاص بك
  password: 'admin123', // كلمة المرور الخاصة بك
});

// اختبار الاتصال
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// دالة مساعدة للاستعلامات
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};