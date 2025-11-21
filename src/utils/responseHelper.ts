import { Response } from 'express';

export class ResponseHelper {
  static success(res: Response, message: string, data?: any, statusCode: number = 200): Response {
    const response: any = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== undefined && data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  static created(res: Response, message: string, data?: any): Response {
    return this.success(res, message, data, 201);
  }

  static successMessage(res: Response, message: string): Response {
    return res.json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(
    res: Response,
    message: string,
    data: any[],
    pagination: { page: number; limit: number; total: number; totalPages: number }
  ): Response {
    return this.success(res, message, {
      items: data,
      pagination
    });
  }

  // ⭐ الدالة الجديدة
  static error(
    res: Response, 
    statusCode: number = 500, 
    message: string, 
    errorCode?: string,
    details?: any
  ): Response {
    const response: any = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errorCode) {
      response.errorCode = errorCode;
    }

    if (details !== undefined && details !== null) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }
}