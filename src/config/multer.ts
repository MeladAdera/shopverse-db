import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../ errors/errorTypes';

// 1. إنشاء مجلدات التحميل إذا لم تكن موجودة
const createUploadsFolders = (): void => {
  const folders = [
    'uploads/products',
    'uploads/temp', 
    'uploads/avatars',
    'uploads/categories'
  ];
  
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`✅ Created folder: ${folder}`);
    }
  });
};

// تنفيذ فوري عند تحميل الملف
createUploadsFolders();

// 2. أنواع الملفات المسموحة
const allowedMimeTypes = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// 3. تصفية الملفات - التحقق من النوع
const fileFilter = (
  req: Request, 
  file: Express.Multer.File, 
  cb: multer.FileFilterCallback
): void => {
  try {
    if (allowedMimeTypes[file.mimetype as keyof typeof allowedMimeTypes]) {
      cb(null, true);
    } else {
      cb(new ValidationError(
        `نوع الملف غير مسموح. المسموح: ${Object.keys(allowedMimeTypes).join(', ')}`
      ));
    }
  } catch (error) {
    cb(error as Error);
  }
};

// 4. إعداد التخزين للمنتجات
const productStorage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, 'uploads/products/');
  },
  
  filename: (
    req: Request, 
    file: Express.Multer.File, 
    cb: (error: Error | null, filename: string) => void
  ) => {
    try {
      // توليد اسم فريد: product-1234567890.jpg
      const fileExt = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const finalName = `product-${uniqueSuffix}${fileExt}`;
      
      cb(null, finalName);
    } catch (error) {
      cb(error as Error, '');
    }
  }
});

// 5. إنشاء middleware جاهز للاستخدام
export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB كحد أقصى
    files: 1 // ملف واحد فقط لكل طلب
  }
}).single('image'); // 'image' هو اسم الحقل في الفورم

// 6. ⭐ الإصلاح: تصحيح أنواع الـ parameters
export const validateImageUpload = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.file) {
    throw new ValidationError('صورة المنتج مطلوبة');
  }
  next();
};

// 7. دالة مساعدة لحذف الملفات
export const deleteFile = (filePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const fullPath = path.join(process.cwd(), filePath);
    
    fs.unlink(fullPath, (error) => {
      if (error) {
        console.error(`❌ Failed to delete file: ${filePath}`, error);
        resolve(false);
      } else {
        console.log(`✅ Deleted file: ${filePath}`);
        resolve(true);
      }
    });
  });
};

// 8. أنواع التصدير
export interface UploadedFileInfo {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  originalname: string;
}

export default {
  uploadProductImage,
  validateImageUpload,
  deleteFile,
  allowedMimeTypes
};