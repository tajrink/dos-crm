import toast from 'react-hot-toast';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    console.error(`Error in ${context || 'application'}:`, error);

    // Handle different types of errors
    if (error && typeof error === 'object' && 'message' in error) {
      // Standard Error object
      const err = error as any;
      return {
        message: err.message,
        code: err.code,
        status: err.status,
        details: error,
      };
    }

    if (typeof error === 'string') {
      // String error
      return {
        message: error,
      };
    }

    const err = error as any;
    
    if (err?.error?.message) {
      // Supabase error format
      return {
        message: err.error.message,
        code: err.error.code,
        status: err.status,
        details: error,
      };
    }

    // Network errors
    if (err?.name === 'NetworkError' || err?.code === 'NETWORK_ERROR') {
      return {
        message: 'Network connection error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // Timeout errors
    if (err?.name === 'TimeoutError' || err?.code === 'TIMEOUT') {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      };
    }

    // Authentication errors
    if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
      return {
        message: 'Authentication required. Please log in again.',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    // Permission errors
    if (err?.status === 403 || err?.code === 'FORBIDDEN') {
      return {
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    // Not found errors
    if (err?.status === 404 || err?.code === 'NOT_FOUND') {
      return {
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        status: 404,
      };
    }

    // Validation errors
    if (err?.status === 422 || err?.code === 'VALIDATION_ERROR') {
      return {
        message: err?.message || 'Validation failed. Please check your input.',
        code: 'VALIDATION_ERROR',
        status: 422,
      };
    }

    // Server errors
    if (err?.status >= 500) {
      return {
        message: 'Server error occurred. Please try again later.',
        code: 'SERVER_ERROR',
        status: err.status,
      };
    }

    // Default fallback
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
    };
  }

  static getErrorMessage(error: unknown, context?: string): string {
    const appError = this.handle(error, context);
    return appError.message;
  }

  static showError(error: unknown, context?: string): void {
    const appError = this.handle(error, context);
    toast.error(appError.message);
  }

  static showSuccess(message: string): void {
    toast.success(message);
  }

  static showWarning(message: string): void {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
      },
    });
  }

  static showInfo(message: string): void {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6',
      },
    });
  }

  static isNetworkError(error: unknown): boolean {
    const err = error as any;
    return (
      err?.name === 'NetworkError' ||
      err?.code === 'NETWORK_ERROR' ||
      err?.message?.includes('fetch') ||
      err?.message?.includes('network')
    );
  }

  static isAuthError(error: unknown): boolean {
    const err = error as any;
    return (
      err?.status === 401 ||
      err?.code === 'UNAUTHORIZED' ||
      err?.message?.includes('auth')
    );
  }

  static isValidationError(error: unknown): boolean {
    const err = error as any;
    return (
      err?.status === 422 ||
      err?.code === 'VALIDATION_ERROR' ||
      err?.name === 'ValidationError'
    );
  }

  static shouldRetry(error: unknown, currentAttempt: number, maxAttempts: number): boolean {
    const err = error as any;
    
    // Don't retry if we've reached max attempts
    if (currentAttempt >= maxAttempts) {
      return false;
    }

    // Don't retry client errors (4xx)
    if (err?.status >= 400 && err?.status < 500) {
      return false;
    }

    // Don't retry validation errors
    if (this.isValidationError(error)) {
      return false;
    }

    // Don't retry authentication errors
    if (this.isAuthError(error)) {
      return false;
    }

    // Retry network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Retry server errors (5xx)
    if (err?.status >= 500) {
      return true;
    }

    // Retry timeout errors
    if (err?.name === 'TimeoutError' || err?.code === 'TIMEOUT') {
      return true;
    }

    // Default: retry for unknown errors
    return true;
  }
}

// Export convenience functions
export const showError = ErrorHandler.showError.bind(ErrorHandler);
export const showSuccess = ErrorHandler.showSuccess.bind(ErrorHandler);
export const showWarning = ErrorHandler.showWarning.bind(ErrorHandler);
export const showInfo = ErrorHandler.showInfo.bind(ErrorHandler);
export const getErrorMessage = ErrorHandler.getErrorMessage.bind(ErrorHandler);

export default ErrorHandler;