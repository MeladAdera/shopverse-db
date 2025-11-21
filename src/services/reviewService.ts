import { reviewRepository } from '../repositories/reviewRepository.js';
import { CreateReviewData, ReviewWithUser, ProductReviewsSummary } from '../models/Review.js';
import { AppError } from '../ errors/AppError.js';

export const reviewService = {
  // 1️⃣ إنشاء تقييم جديد مع التحقق من الشروط
  async createReview(reviewData: CreateReviewData): Promise<any> {
    const { user_id, product_id, rating } = reviewData;

    // التحقق من أن التقييم بين 1-5
    if (rating < 1 || rating > 5) {
      throw new AppError('التقييم يجب أن يكون بين 1 و 5 نجوم', 400);
    }

    // التحقق من أن المستخدم لم يقم المنتج مسبقاً
    const hasReviewed = await reviewRepository.userHasReviewed(product_id, user_id);
    if (hasReviewed) {
      throw new AppError('لقد قمت بتقييم هذا المنتج مسبقاً', 400);
    }

    // إنشاء التقييم
    const review = await reviewRepository.create(reviewData);
    
    return {
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: review
    };
  },

  // 2️⃣ جلب تقييمات المنتج
  async getProductReviews(productId: number): Promise<ReviewWithUser[]> {
    if (!productId) {
      throw new AppError('معرف المنتج مطلوب', 400);
    }

    const reviews = await reviewRepository.getByProductId(productId);
    return reviews;
  },

  // 3️⃣ جلب إحصائيات التقييمات
  async getProductReviewsSummary(productId: number): Promise<ProductReviewsSummary> {
    if (!productId) {
      throw new AppError('معرف المنتج مطلوب', 400);
    }

    const summary = await reviewRepository.getSummary(productId);
    return summary;
  },

  // 4️⃣ حذف التقييم (فقط صاحب التقييم يمكنه الحذف)
  async deleteReview(reviewId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const deleted = await reviewRepository.delete(reviewId, userId);
    
    if (!deleted) {
      throw new AppError('لم يتم العثور على التقييم أو لا تملك صلاحية الحذف', 404);
    }

    return {
      success: true,
      message: 'تم حذف التقييم بنجاح'
    };
  },

  // 5️⃣ التحقق من إمكانية التقييم
  async canUserReview(productId: number, userId: number): Promise<{ canReview: boolean; message?: string }> {
    const hasReviewed = await reviewRepository.userHasReviewed(productId, userId);
    
    if (hasReviewed) {
      return {
        canReview: false,
        message: 'لقد قمت بتقييم هذا المنتج مسبقاً'
      };
    }

    return {
      canReview: true
    };
  }
};