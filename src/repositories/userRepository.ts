// src/repositories/userRepository.ts
import { query } from '../config/database.js';
import { User, CreateUserData } from '../models/User.js';

/**
 * مستودع المستخدمين - مسؤول فقط عن عمليات قاعدة البيانات
 */
export class UserRepository {
  /**
   * إنشاء مستخدم جديد في قاعدة البيانات
   */
  static async create(userData: CreateUserData): Promise<Omit<User, 'password_hash'>> {
    const { name, email, password_hash, role = 'user' } = userData;
    
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role]
    );
    
    return result.rows[0];
  }

  /**
   * البحث عن مستخدم بالإيميل
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  }

  /**
   * البحث عن مستخدم بالـ ID
   */
  static async findById(id: number): Promise<Omit<User, 'password_hash'> | null> {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * البحث عن مستخدم بالـ ID مع كلمة المرور (للاستخدام الداخلي)
   */
  static async findByIdWithPassword(id: number): Promise<User | null> {
    const result = await query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * التحقق من وجود إيميل
   */
  static async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows.length > 0;
  }

  /**
   * الحصول على جميع المستخدمين (للمسؤول)
   */
  static async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    return result.rows;
  }

  /**
   * تحديث بيانات المستخدم
   */
  static async update(userId: number, updateData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<Omit<User, 'password_hash'>> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name) {
      fields.push(`name = $${paramCount}`);
      values.push(updateData.name);
      paramCount++;
    }

    if (updateData.email) {
      fields.push(`email = $${paramCount}`);
      values.push(updateData.email);
      paramCount++;
    }

    if (updateData.role) {
      fields.push(`role = $${paramCount}`);
      values.push(updateData.role);
      paramCount++;
    }

    if (updateData.password_hash) {
      fields.push(`password_hash = $${paramCount}`);
      values.push(updateData.password_hash);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, name, email, role, created_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * حذف مستخدم
   */
  static async delete(userId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );
    
    return (result.rowCount || 0) > 0; // ✅ إصلاح الخطأ هنا
  }

  /**
   * تحديث كلمة المرور
   */
  static async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    if ((result.rowCount || 0) === 0) { // ✅ إصلاح الخطأ هنا
      throw new Error('User not found');
    }
  }

  /**
   * الحصول على إحصائيات المستخدمين (للمسؤول)
   */
  static async getStats(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    recentUsers: number;
  }> {
    const totalResult = await query('SELECT COUNT(*) as count FROM users');
    const adminResult = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['admin']);
    const recentResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\''
    );

    return {
      totalUsers: parseInt(totalResult.rows[0].count),
      totalAdmins: parseInt(adminResult.rows[0].count),
      recentUsers: parseInt(recentResult.rows[0].count)
    };
  }
}