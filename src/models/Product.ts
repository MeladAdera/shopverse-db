// backend/src/models/Product.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_urls: string[]; // ⭐ أصبحت مصفوفة لتتناسب مع DB
  category_id: number;
  active: boolean; // ⭐ أضفنا حقل active
  created_at: Date;
  updated_at?: Date;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image_urls: string[]; // ⭐ أصبحت مصفوفة
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: number;
  image_urls?: string[]; // ⭐ أصبحت مصفوفة
  active?: boolean; // ⭐ أضفنا active
}

export interface ProductQueryFilters {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  in_stock?: boolean;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'; // ⭐ أضفنا sort
  offset?: number; // ⭐ أضفنا offset
}

// ✅ واجهة جديدة لبيانات المنتج مع الصورة
export interface ProductWithCategory extends Product {
  category_name?: string;
}

// ✅ واجهة لرد المنتج (بدون حقول حساسة)
export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_urls: string[]; // ⭐ أصبحت image_urls كمصفوفة
  category_id: number;
  category_name?: string;
  active?: boolean;
  created_at: Date;
  review_count?: number;
  average_rating?: number;
}

// ✅ واجهة لإنشاء منتج مع تحقق من البيانات
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
 image_urls: string[];
  category_id: number;
}

// ✅ واجهة لتحديث منتج
export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: number;
}