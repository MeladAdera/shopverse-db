// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AuthService } from '../services/authService.js';
import { catchAsync } from '../ errors/errorTypes.js';
import { ResponseHelper } from '../utils/responseHelper.js'; // ⭐ الجديد

/**
 * تسجيل مستخدم جديد
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  const result = await AuthService.register({ name, email, password });

  // ✅ بدلاً من: res.status(201).json({...})
  return ResponseHelper.created(res, 'User registered successfully', result);
});

/**
 * تسجيل الدخول
 */
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const result = await AuthService.login({ email, password });

  // ✅ بدلاً من: res.json({...})
  return ResponseHelper.success(res, 'Login successful', result);
});

/**
 * تجديد التوكن
 */
export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  const result = await AuthService.refreshToken(refreshToken);

  // ✅ بدلاً من: res.json({...})
  return ResponseHelper.success(res, 'Tokens refreshed successfully', result);
});

/**
 * الحصول على الملف الشخصي
 */
export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userProfile = await AuthService.getProfile(req.user!.userId);

  // ✅ بدلاً من: res.json({...})
  return ResponseHelper.success(res, 'Profile retrieved successfully', {
    user: userProfile
  });
});

/**
 * تسجيل الخروج
 */
export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // ✅ بدلاً من: res.json({...})
  return ResponseHelper.successMessage(res, 'Logout successful');
});