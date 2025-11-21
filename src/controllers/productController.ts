import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProductService } from '../services/productService.js';
import { catchAsync } from '../ errors/errorTypes.js';
import { ResponseHelper } from '../utils/responseHelper.js';
import { ValidationError } from '../ errors/errorTypes.js';

/**
 * تحكمات المنتجات
 */
export class ProductController {
  /**
   * إنشاء منتج جديد (للمسؤول فقط) - مع دعم رفع الصور
   */
  static createProduct = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // ⭐ الآن req.file موجود من multer
    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : '';
    
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      category_id: parseInt(req.body.category_id),
      image_urls: [imagePath] 
    };

    // ⭐ التحقق من البيانات المطلوبة
    if (!productData.name || !productData.description || !productData.price || !productData.category_id) {
      throw new ValidationError('All required fields must be provided: name, description, price, category_id');
    }

    const result = await ProductService.createProduct(productData);

    return ResponseHelper.created(res, 'Product created successfully', result);
  });

  /**
   * الحصول على منتج بالـ ID
   */
  static getProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    
    const product = await ProductService.getProductById(productId);

    return ResponseHelper.success(res, 'Product retrieved successfully', product);
  });

  /**
   * الحصول على جميع المنتجات مع التصفية
   */
  static getProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      search: req.query.search as string,
      in_stock: req.query.in_stock === 'true',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sort: req.query.sort as 'newest' | 'price_asc' | 'price_desc' | 'popular',
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    // ⭐ الإصلاح: تحقق من أن الأرقام صالحة
    if (filters.category_id && isNaN(filters.category_id)) {
      filters.category_id = undefined;
    }
    
    if (filters.min_price && isNaN(filters.min_price)) {
      filters.min_price = undefined;
    }
    
    if (filters.max_price && isNaN(filters.max_price)) {
      filters.max_price = undefined;
    }
    
    if (filters.page && isNaN(filters.page)) {
      filters.page = 1;
    }
    
    if (filters.limit && isNaN(filters.limit)) {
      filters.limit = 20;
    }

    const result = await ProductService.getProducts(filters);

    return ResponseHelper.success(res, 'Products retrieved successfully', result);
  });

  /**
   * تحديث منتج (للمسؤول فقط)
   */
  static updateProduct = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    
    // ⭐ تحويل types إذا كانت البيانات من form-data
    const updateData: any = { ...req.body };
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);

    const updatedProduct = await ProductService.updateProduct(productId, updateData);

    return ResponseHelper.success(res, 'Product updated successfully', updatedProduct);
  });

  /**
   * تحديث صور المنتج (للمسؤول فقط) - مع دعم رفع الصور
   */
  static updateProductImages = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    
    let image_urls: string[] = [];

    // ⭐ إذا كان هناك ملف مرفوع، استخدمه
    if (req.file) {
      image_urls = [`/uploads/products/${req.file.filename}`];
    } 
    // ⭐ إذا لم يكن هناك ملف، تحقق من image_urls في body
    else if (req.body.image_urls) {
      image_urls = Array.isArray(req.body.image_urls) ? req.body.image_urls : [req.body.image_urls];
    }

    if (image_urls.length === 0) {
      throw new ValidationError('Either upload an image or provide image_urls');
    }

    const updatedProduct = await ProductService.updateProductImages(productId, image_urls);

    return ResponseHelper.success(res, 'Product images updated successfully', updatedProduct);
  });

  /**
   * حذف منتج (للمسؤول فقط)
   */
  static deleteProduct = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);

    const result = await ProductService.deleteProduct(productId);

    return ResponseHelper.success(res, result.message);
  });

  /**
   * الحصول على منتجات بالتصنيف
   */
  static getProductsByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = parseInt(req.params.categoryId);

    const products = await ProductService.getProductsByCategory(categoryId);

    return ResponseHelper.success(res, 'Products retrieved successfully', products);
  });

  /**
   * تحديث مخزون المنتج (للمسؤول فقط)
   */
  static updateProductStock = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    const stock = parseInt(req.body.stock);

    if (isNaN(stock)) {
      throw new ValidationError('Valid stock quantity is required');
    }

    const updatedProduct = await ProductService.updateProductStock(productId, stock);

    return ResponseHelper.success(res, 'Product stock updated successfully', updatedProduct);
  });

  /**
   * الحصول على إحصائيات المنتجات (للمسؤول فقط)
   */
  static getProductStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const stats = await ProductService.getProductStats();

    return ResponseHelper.success(res, 'Product stats retrieved successfully', stats);
  });
}

export default ProductController;