export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number; // من 1 إلى 5 نجوم
  comment?: string;
  created_at: Date;
}

export interface CreateReviewData {
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
}

export interface ReviewWithUser extends Review {
  user_name: string;     // ✅ الاسم الحقيقي للمستخدم
  user_email: string;    // ✅ الإيميل الحقيقي للمصداقية
}

export interface ProductReviewsSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number; // عدد التقييمات بنجمة واحدة
    2: number; 
    3: number;
    4: number;
    5: number; // عدد التقييمات بـ5 نجوم
  };
}

export interface ReviewFilters {
  product_id?: number;
  user_id?: number;
  min_rating?: number;
  max_rating?: number;
  page?: number;
  limit?: number;
}