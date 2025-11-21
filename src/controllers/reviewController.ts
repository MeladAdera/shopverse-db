import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService.js';
import { AppError } from '../ errors/AppError.js';
import { ResponseHelper } from '../utils/responseHelper.js';

export const reviewController = {
  // 1️⃣ إنشاء تقييم جديد
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { product_id, rating, comment } = req.body;
      const user_id = req.user?.id;  // ⭐ من middleware المصادقة

      // التحقق من البيانات المطلوبة
      if (!product_id || !rating || !user_id) {
        throw new AppError('بيانات التقييم غير مكتملة', 400);
      }

      const result = await reviewService.createReview({
        user_id,
        product_id,
        rating,
        comment
      });

      ResponseHelper.success(res, result.message, result.data, 201);
      
    } catch (error) {
      next(error);
    }
  },

  // 2️⃣ جلب تقييمات منتج معين
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(req.params.productId);
      
      if (!productId) {
        throw new AppError('معرف المنتج مطلوب', 400);
      }

      const reviews = await reviewService.getProductReviews(productId);
      
      ResponseHelper.success(res, 'تم جلب التقييمات بنجاح', reviews);
      
    } catch (error) {
      next(error);
    }
  },

  // 3️⃣ جلب إحصائيات التقييمات لمنتج
  async getProductReviewsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(req.params.productId);
      
      if (!productId) {
        throw new AppError('معرف المنتج مطلوب', 400);
      }

      const summary = await reviewService.getProductReviewsSummary(productId);
      
      ResponseHelper.success(res, 'تم جلب إحصائيات التقييمات بنجاح', summary);
      
    } catch (error) {
      next(error);
    }
  },

  // 4️⃣ حذف تقييم
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const user_id = req.user?.id;

      if (!reviewId || !user_id) {
        throw new AppError('بيانات غير مكتملة', 400);
      }

      const result = await reviewService.deleteReview(reviewId, user_id);
      
      ResponseHelper.success(res, result.message);
      
    } catch (error) {
      next(error);
    }
  },

  // 5️⃣ التحقق من إمكانية التقييم
  async checkCanReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(req.params.productId);
      const user_id = req.user?.id;

      if (!productId || !user_id) {
        throw new AppError('بيانات غير مكتملة', 400);
      }

      const result = await reviewService.canUserReview(productId, user_id);
      
      ResponseHelper.success(res, 'تم التحقق بنجاح', result);
      
    } catch (error) {
      next(error);
    }
  }
};