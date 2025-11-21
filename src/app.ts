// src/app.ts - النسخة المصححة
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// استيراد الإعدادات الجديدة
import { corsOptions } from './config/cors.js';
import { limiter } from './config/rateLimit.js';
import { env } from './config/env.js';

// استيراد نظام الأخطاء الجديد
import { errorHandler, notFoundHandler } from './ errors/errorHandler.js';

// استيراد الـ Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors(corsOptions));
app.use('/uploads', express.static('uploads')); // ✅ خدمة الملف

// Rate Limiting - مختلف حسب البيئة
app.use('/api/', env.NODE_ENV === 'production' ? limiter : (req, res, next) => next());

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging based on environment
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.get('/api/health', (req, res) => {
  
  res.status(200).json({
    success: true,
    message: '🛍️ Shopverse Backend is running!',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Shopverse API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // ⭐ وهذا السطر


// 404 Handler - استخدام النظام الجديد
app.use(notFoundHandler);

// Global Error Handler - استخدام النظام الجديد
app.use(errorHandler);

export default app;