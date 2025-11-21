// src/types/multer.d.ts (إذا احتجت)
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}