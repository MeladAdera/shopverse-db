// src/errors/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';
import { env } from '../config/env.js';
import { NotFoundError } from './errorTypes.js';

/**
 * Central error handling middleware for Express applications
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Convert unknown errors to AppError
  let handledError: AppError;
  
  if (error instanceof AppError) {
    handledError = error;
  } else {
    // Unexpected error - convert to InternalServerError
    handledError = new AppError(
      error.message || 'Something went wrong',
      500,
      false
    );
  }

  // Log error with request details
  logError(handledError, req);

  // Send appropriate response based on environment
  sendErrorResponse(handledError, req, res);
};

/**
 * Log error with request context details
 */
const logError = (error: AppError, req: Request) => {
  const logDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack,
      details: error.details,
    }
  };

  if (error.statusCode >= 500) {
    // Server errors - log as error
    console.error('🚨 Server Error:', logDetails);
  } else {
    // Client errors - log as warning
    console.warn('⚠️ Client Error:', logDetails);
  }
};

/**
 * Send formatted error response to client
 */
const sendErrorResponse = (error: AppError, req: Request, res: Response) => {
  // Development environment - detailed error information
  if (env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    // Production environment - secure error messages
    if (error.isOperational) {
      // Expected operational errors - show original message
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(error.code && { code: error.code })
      });
    } else {
      // Unexpected errors - generic message
      res.status(500).json({
        success: false,
        error: 'Something went wrong!'
      });
    }
  }
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Wrapper to catch async errors in route handlers
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};