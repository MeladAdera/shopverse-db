// src/routes/authRoutes.ts
import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  getProfile, 
  logout 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { authSchemas } from '../middleware/validate.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    تسجيل مستخدم جديد
 * @access  Public
 */
router.post(
  '/register',
  validateRequest(authSchemas.register),
  register
);

/**
 * @route   POST /api/auth/login  
 * @desc    تسجيل دخول
 * @access  Public
 */
router.post(
  '/login',
  validateRequest(authSchemas.login),
  login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    تجديد التوكن
 * @access  Public
 */
router.post(
  '/refresh-token',
  refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    الحصول على بيانات المستخدم
 * @access  Private (يحتاج توكن)
 */
router.get(
  '/profile',
  authenticate,
  getProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    تسجيل خروج
 * @access  Private (يحتاج توكن)
 */
router.post(
  '/logout',
  authenticate,
  logout
);

export default router;