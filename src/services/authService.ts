// src/services/authService.ts
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { UserRepository } from '../repositories/userRepository.js';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError 
} from '../ errors/errorTypes.js';

// أنواع البيانات
export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * خدمة المصادقة - الآن تحتوي على business logic فقط
 */
export class AuthService {
  /**
   * تسجيل مستخدم جديد
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const { name, email, password } = userData;

    // 1. التحقق من قوة كلمة المرور ← منطق
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.message!);
    }

    // 2. التحقق من وجود الإيميل ← Repository
    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      throw new ConflictError('Email already exists');
    }

    // 3. تشفير كلمة المرور ← منطق
    const passwordHash = await hashPassword(password);

    // 4. إنشاء المستخدم ← Repository
    const newUser = await UserRepository.create({
      name,
      email,
      password_hash: passwordHash,
      role: 'user'
    });

    // 5. إنشاء التوكنات ← منطق
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 6. إرجاع النتيجة النهائية
    return {
      user: newUser, // بالفعل بدون password_hash
      accessToken,
      refreshToken
    };
  }

  /**
   * تسجيل الدخول
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // 1. البحث عن المستخدم ← Repository
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 2. التحقق من كلمة المرور ← منطق
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 3. إنشاء التوكنات ← منطق
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 4. إرجاع النتيجة النهائية
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * تجديد التوكن
   */
  static async refreshToken(refreshToken: string): Promise<{ 
    accessToken: string; 
    refreshToken: string; 
  }> {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // 1. التحقق من صحة الـ refresh token ← منطق
    const decoded = verifyRefreshToken(refreshToken);

    // 2. التأكد من وجود المستخدم ← Repository
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 3. إنشاء توكنات جديدة ← منطق
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // 4. إرجاع النتيجة النهائية
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * الحصول على بيانات المستخدم
   */
  static async getProfile(userId: number): Promise<{
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: Date;
  }> {
    // 1. البحث عن المستخدم ← Repository
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 2. إرجاع بيانات المستخدم
    return user; // بالفعل بدون password_hash
  }
}