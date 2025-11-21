import { ProductRepository } from '../repositories/productRepository.js';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductResponse,
  ProductQueryFilters 
} from '../models/Product.js';
import { ValidationError, NotFoundError, ConflictError } from '../ errors/errorTypes.js';

// أنواع البيانات للـ Service
export interface ProductListResponse {
  products: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductStats {
  totalProducts: number;
  outOfStock: number;
  totalCategories: number;
}

/**
 * خدمة المنتجات - تحتوي على business logic فقط
 */
export class ProductService {
  /**
   * إنشاء منتج جديد
   */
  static async createProduct(productData: CreateProductInput & { image_urls: string[] }): Promise<ProductResponse> {
    const { name, description, price, stock, image_urls, category_id } = productData;

    // 1. التحقق من البيانات ← منطق
    if (price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    if (stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    if (image_urls.length === 0) {
      throw new ValidationError('At least one image is required');
    }

    // 2. التحقق من أن السعر منطقي ← منطق
    if (price > 1000000) {
      throw new ValidationError('Price is too high');
    }

    // 3. التحقق من عدم وجود منتج بنفس الاسم
    const productExists = await ProductRepository.existsByName(name);
    if (productExists) {
      throw new ConflictError('Product with this name already exists');
    }

    // 4. إنشاء المنتج ← Repository
    const newProduct = await ProductRepository.create({
      name,
      description,
      price,
      stock,
      image_urls,
      category_id
    });

    // 5. إرجاع النتيجة النهائية
    return this.formatProductResponse(newProduct);
  }

  /**
   * الحصول على منتج بالـ ID
   */
  static async getProductById(id: number): Promise<ProductResponse> {
    // 1. البحث عن المنتج ← Repository
    const product = await ProductRepository.findById(id);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // 2. إرجاع النتيجة
    return this.formatProductResponse(product);
  }

  /**
   * الحصول على جميع المنتجات مع التصفية
   */
  static async getProducts(filters: ProductQueryFilters = {}): Promise<ProductListResponse> {
    // 1. التحقق من بيانات التصفية ← منطق
    if (filters.min_price && filters.min_price < 0) {
      throw new ValidationError('Minimum price cannot be negative');
    }

    if (filters.max_price && filters.max_price < 0) {
      throw new ValidationError('Maximum price cannot be negative');
    }

    if (filters.min_price && filters.max_price && filters.min_price > filters.max_price) {
      throw new ValidationError('Minimum price cannot be greater than maximum price');
    }

    // 2. الحصول على المنتجات ← Repository
    const products = await ProductRepository.findAll(filters);

    // 3. تنسيق النتيجة النهائية
    const formattedProducts = products.map(product => this.formatProductResponse(product));

    // 4. إرجاع النتيجة مع Pagination مبسط
    return {
      products: formattedProducts,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: formattedProducts.length,
        totalPages: Math.ceil(formattedProducts.length / (filters.limit || 20))
      }
    };
  }

  /**
   * تحديث منتج
   */
  static async updateProduct(id: number, updateData: UpdateProductInput): Promise<ProductResponse> {
    // 1. التحقق من وجود المنتج ← Repository
    const productExists = await ProductRepository.exists(id);
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    // 2. التحقق من بيانات التحديث ← منطق
    if (updateData.price !== undefined && updateData.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    if (updateData.stock !== undefined && updateData.stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    // 3. التحقق من عدم وجود منتج آخر بنفس الاسم
    if (updateData.name) {
      const nameExists = await ProductRepository.existsByName(updateData.name, id);
      if (nameExists) {
        throw new ConflictError('Another product with this name already exists');
      }
    }

    // 4. تحديث المنتج ← Repository
    const updatedProduct = await ProductRepository.update(id, updateData);
    
    if (!updatedProduct) {
      throw new NotFoundError('Product not found after update');
    }

    // 5. إرجاع النتيجة النهائية
    return this.formatProductResponse(updatedProduct);
  }

  /**
   * تحديث صور المنتج
   */
  static async updateProductImages(id: number, image_urls: string[]): Promise<ProductResponse> {
    // 1. التحقق من وجود المنتج ← Repository
    const productExists = await ProductRepository.exists(id);
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    // 2. التحقق من الصور
    if (image_urls.length === 0) {
      throw new ValidationError('At least one image is required');
    }

    // 3. تحديث الصور ← Repository
    const updatedProduct = await ProductRepository.updateImages(id, image_urls);
    
    if (!updatedProduct) {
      throw new NotFoundError('Product not found after image update');
    }

    // 4. إرجاع النتيجة النهائية
    return this.formatProductResponse(updatedProduct);
  }

  /**
   * حذف منتج (Soft Delete)
   */
  static async deleteProduct(id: number): Promise<{ message: string }> {
    // 1. التحقق من وجود المنتج ← Repository
    const productExists = await ProductRepository.exists(id);
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    // 2. حذف المنتج منطقياً ← Repository
    const deleted = await ProductRepository.softDelete(id);
    
    if (!deleted) {
      throw new Error('Failed to delete product');
    }

    // 3. إرجاع رسالة نجاح
    return { message: 'Product deleted successfully' };
  }

  /**
   * الحصول على منتجات بالتصنيف
   */
  static async getProductsByCategory(categoryId: number): Promise<ProductResponse[]> {
    // 1. الحصول على المنتجات ← Repository
    const products = await ProductRepository.findByCategory(categoryId);

    // 2. تنسيق النتيجة النهائية
    return products.map(product => this.formatProductResponse(product));
  }

  /**
   * تحديث مخزون المنتج
   */
  static async updateProductStock(id: number, newStock: number): Promise<ProductResponse> {
    // 1. التحقق من القيم ← منطق
    if (newStock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    // 2. تحديث المخزون ← Repository
    const updated = await ProductRepository.updateStock(id, newStock);
    
    if (!updated) {
      throw new NotFoundError('Product not found');
    }

    // 3. إرجاع النتيجة النهائية
    return this.formatProductResponse(updated);
  }

  /**
   * الحصول على إحصائيات المنتجات
   */
  static async getProductStats(): Promise<ProductStats> {
    // 1. الحصول على الإحصائيات ← Repository
    const stats = await ProductRepository.getStats();

    // 2. إرجاع النتيجة النهائية
    return stats;
  }

  /**
   * دالة مساعدة لتنسيق رد المنتج
   */
  private static formatProductResponse(product: any): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: product.stock,
      image_urls: product.image_urls || [],
      category_id: product.category_id,
      category_name: product.category_name,
      active: product.active,
      created_at: product.created_at,
      review_count: product.review_count ? parseInt(product.review_count) : 0,
      average_rating: product.average_rating ? parseFloat(product.average_rating) : 0
    };
  }
}