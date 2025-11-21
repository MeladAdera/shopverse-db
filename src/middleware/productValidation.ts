// backend/src/middleware/validation/productValidation.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب").max(200),
  description: z.string().min(1, "الوصف مطلوب"),
  price: z.number().positive("السعر يجب أن يكون موجب").max(9999999.99, "السعر كبير جداً"),
  stock: z.number().int().min(0, "المخزون لا يمكن أن يكون سالب"),
  category_id: z.number().int().positive("التصنيف مطلوب"),
  image_urls: z.array(z.string().url("رابط الصورة غير صالح")).optional(),
});

export const updateProductSchema = createProductSchema.partial();