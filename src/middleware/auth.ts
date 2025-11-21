// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../ errors/errorTypes.js';

// Extend Request type to include user property
export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware to verify JWT access token
 * Adds decoded user data to request object
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token is required');
    }

    // Parse token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Invalid token format');
    }

    // Verify token validity and decode payload
    const decoded = verifyAccessToken(token);
    
    // Attach user data to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce admin role access
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce any authenticated user access
 * Must be used after authenticate middleware
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    next();
  } catch (error) {
    next(error);
  }
};