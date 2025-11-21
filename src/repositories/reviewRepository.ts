import { query } from '../config/database';
import { Review, CreateReviewData, ReviewWithUser, ProductReviewsSummary } from '../models/Review.js';

export const reviewRepository = {
  // 1️⃣ إنشاء تقييم جديد
  async create(reviewData: CreateReviewData): Promise<Review> {
    const { user_id, product_id, rating, comment } = reviewData;
    
    const result = await query(
      `INSERT INTO reviews (user_id, product_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [user_id, product_id, rating, comment]
    );
    
    return result.rows[0];
  },

  // 2️⃣ جلب تقييمات منتج معين (مع بيانات المستخدم)
  async getByProductId(productId: number): Promise<ReviewWithUser[]> {
    const result = await query(
      `SELECT r.*, u.name as user_name, u.email as user_email 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );
    
    return result.rows;
  },

  // 3️⃣ جلب إحصائيات التقييمات لمنتج
  async getSummary(productId: number): Promise<ProductReviewsSummary> {
    const result = await query(
      `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_reviews,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
       FROM reviews 
       WHERE product_id = $1`,
      [productId]
    );
    
    const row = result.rows[0];
    
    return {
      average_rating: parseFloat(row.average_rating) || 0,
      total_reviews: parseInt(row.total_reviews) || 0,
      rating_distribution: {
        1: parseInt(row.rating_1) || 0,
        2: parseInt(row.rating_2) || 0,
        3: parseInt(row.rating_3) || 0,
        4: parseInt(row.rating_4) || 0,
        5: parseInt(row.rating_5) || 0
      }
    };
  },

  // 4️⃣ التحقق إذا كان المستخدم قيم المنتج مسبقاً
  async userHasReviewed(productId: number, userId: number): Promise<boolean> {
    const result = await query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId]
    );
    
    return result.rows.length > 0;
  },

  // 5️⃣ حذف تقييم
  async delete(reviewId: number, userId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [reviewId, userId]
    );
    
    return result.rows.length > 0;
  }
};