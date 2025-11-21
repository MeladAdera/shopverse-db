// src/models/User.ts
// الآن الـ Model يحتوي على الأنواع فقط، والمنطق انتقل للـ Repository

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at?: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password_hash: string;
  role?: 'user' | 'admin';
}

