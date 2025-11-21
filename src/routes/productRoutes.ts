// // src/routes/productRoutes.ts
import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadProductImage, validateImageUpload } from '../config/multer.js';

const router = Router();

// 🔓 Routes públicas (لا تحتاج مصادقة)
router.get('/', ProductController.getProducts);
router.get('/stats', ProductController.getProductStats); // قد تريد جعلها للمسؤول فقط
router.get('/category/:categoryId', ProductController.getProductsByCategory);
router.get('/:id', ProductController.getProduct);

// 🔐 Routes محمية (تحتاج مصادقة مسؤول)
router.post(
  '/',
  authenticate,
  requireAdmin,
   uploadProductImage,
   validateImageUpload, 
  ProductController.createProduct
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  ProductController.updateProduct
);

router.patch(
  '/:id/images',
  authenticate,
  requireAdmin,
  ProductController.updateProductImages
);

router.patch(
  '/:id/stock',
  authenticate,
  requireAdmin,
  ProductController.updateProductStock
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  ProductController.deleteProduct
);

export default router;