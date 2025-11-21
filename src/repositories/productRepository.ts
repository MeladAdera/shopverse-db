import { pool } from '../config/database.js';
import { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductWithCategory,
  ProductQueryFilters 
} from '../models/Product.js';

export class ProductRepository {
  
  /**
   * إنشاء منتج جديد
   */
  static async create(productData: CreateProductData): Promise<Product> {
    const { name, description, price, stock, image_urls, category_id } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, stock, category_id, image_urls)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [name, description, price, stock, category_id, image_urls];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * الحصول على جميع المنتجات مع التصفية
   */
  static async findAll(filters: ProductQueryFilters = {}): Promise<ProductWithCategory[]> {
    let query = `
      SELECT 
        p.*, 
        c.name as category_name,
        COUNT(r.id) as review_count,
        AVG(r.rating) as average_rating
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.active = true
    `;
    
    const values: any[] = [];
    let paramCount = 1;

    // التصفية حسب التصنيف
    if (filters.category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(filters.category_id);
      paramCount++;
    }

    // البحث بالاسم أو الوصف
    if (filters.search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    // التصفية حسب السعر
    if (filters.min_price) {
      query += ` AND p.price >= $${paramCount}`;
      values.push(filters.min_price);
      paramCount++;
    }

    if (filters.max_price) {
      query += ` AND p.price <= $${paramCount}`;
      values.push(filters.max_price);
      paramCount++;
    }

    // التصفية حسب المخزون
    if (filters.in_stock) {
      query += ` AND p.stock > 0`;
    }

    // التجميع للريفيوات
    query += ` GROUP BY p.id, c.name`;

    // الترتيب
    switch (filters.sort) {
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'popular':
        query += ` ORDER BY review_count DESC, average_rating DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.created_at DESC`;
        break;
    }

    // الترقيم (Pagination)
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
      
      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(filters.offset);
      }
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * الحصول على منتج بواسطة ID
   */
  static async findById(id: number): Promise<ProductWithCategory | null> {
    const query = `
      SELECT 
        p.*, 
        c.name as category_name,
        COUNT(r.id) as review_count,
        AVG(r.rating) as average_rating
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1 AND p.active = true
      GROUP BY p.id, c.name
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * تحديث منتج
   */
  static async update(id: number, productData: UpdateProductData): Promise<Product | null> {
    const fields: string[] = [];
    const values = [];
    let paramCount = 1;

    // بناء الجملة الديناميكية
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND active = true
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * حذف منطقي (Soft Delete)
   */
  static async softDelete(id: number): Promise<boolean> {
    const query = `
      UPDATE products 
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND active = true
    `;
    
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * حذف فعلي
   */
  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * التحقق من وجود منتج
   */
  static async exists(id: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND active = true',
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * التحقق من وجود منتج بنفس الاسم
   */
  static async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let query = `SELECT id FROM products WHERE name = $1 AND active = true`;
    const values: any[] = [name];

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * تحديث المخزون
   */
  static async updateStock(id: number, newStock: number): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET stock = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [newStock, id]);
    return result.rows[0] || null;
  }

  /**
   * البحث عن منتجات بالتصنيف
   */
  static async findByCategory(categoryId: number): Promise<ProductWithCategory[]> {
    const query = `
      SELECT 
        p.*, 
        c.name as category_name,
        COUNT(r.id) as review_count,
        AVG(r.rating) as average_rating
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.category_id = $1 AND p.active = true
      GROUP BY p.id, c.name
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }

  /**
   * تحديث الصور فقط
   */
  static async updateImages(id: number, image_urls: string[]): Promise<Product | null> {
    const result = await pool.query(
      `UPDATE products SET image_urls = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND active = true
       RETURNING *`,
      [image_urls, id]
    );
    return result.rows[0] || null;
  }

  /**
   * الحصول على إحصائيات المنتجات
   */
  static async getStats(): Promise<{
    totalProducts: number;
    outOfStock: number;
    totalCategories: number;
  }> {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE active = true');
    const outOfStockResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock = 0 AND active = true');
    const categoriesResult = await pool.query('SELECT COUNT(DISTINCT category_id) as count FROM products WHERE active = true');

    return {
      totalProducts: parseInt(totalResult.rows[0].count),
      outOfStock: parseInt(outOfStockResult.rows[0].count),
      totalCategories: parseInt(categoriesResult.rows[0].count)
    };
  }
}