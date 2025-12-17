import { toast } from 'sonner'
import { logger } from './logger'

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  code?: string
  statusCode?: number
}

/**
 * Maps Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: any): AppError {
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
      originalError: error
    }
  }

  // Auth errors
  if (error.status === 401 || error.message?.includes('JWT') || error.message?.includes('token')) {
    return {
      type: ErrorType.AUTH,
      message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
      originalError: error,
      statusCode: 401
    }
  }

  // Permission errors
  if (error.status === 403 || error.code === '42501' || error.message?.includes('permission')) {
    return {
      type: ErrorType.PERMISSION,
      message: 'Bu işlem için yetkiniz bulunmamaktadır.',
      originalError: error,
      statusCode: 403
    }
  }

  // Not found errors
  if (error.status === 404 || error.code === 'PGRST116') {
    return {
      type: ErrorType.NOT_FOUND,
      message: 'Aranan kayıt bulunamadı.',
      originalError: error,
      statusCode: 404
    }
  }

  // Validation errors
  if (error.code === '23505') { // Unique violation
    return {
      type: ErrorType.VALIDATION,
      message: 'Bu kayıt zaten mevcut.',
      originalError: error,
      code: error.code
    }
  }

  if (error.code === '23503') { // Foreign key violation
    return {
      type: ErrorType.VALIDATION,
      message: 'İlişkili kayıt bulunamadı.',
      originalError: error,
      code: error.code
    }
  }

  if (error.code === '23514') { // Check violation
    return {
      type: ErrorType.VALIDATION,
      message: 'Girilen değer geçersiz.',
      originalError: error,
      code: error.code
    }
  }

  // Server errors
  if (error.status >= 500 || error.code?.startsWith('P')) {
    return {
      type: ErrorType.SERVER,
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      originalError: error,
      statusCode: error.status || 500
    }
  }

  // Default
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Beklenmeyen bir hata oluştu.',
    originalError: error
  }
}

/**
 * Handles errors and shows appropriate user feedback
 */
export function handleError(error: any, options?: {
  showToast?: boolean
  logError?: boolean
  customMessage?: string
  onError?: (appError: AppError) => void
}): AppError {
  const appError = mapSupabaseError(error)

  // Log error
  if (options?.logError !== false) {
    logger.error('Error handled:', {
      type: appError.type,
      message: appError.message,
      originalError: appError.originalError,
      code: appError.code,
      statusCode: appError.statusCode
    })
  }

  // Show toast notification
  if (options?.showToast !== false) {
    const message = options?.customMessage || appError.message
    toast.error(message, {
      duration: appError.type === ErrorType.NETWORK ? 5000 : 3000
    })
  }

  // Call custom error handler if provided
  if (options?.onError) {
    options.onError(appError)
  }

  return appError
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    showToast?: boolean
    logError?: boolean
    customMessage?: string
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, options)
      throw error // Re-throw to allow caller to handle if needed
    }
  }) as T
}

/**
 * Retry mechanism for network errors
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const appError = mapSupabaseError(error)

      // Only retry on network errors
      if (appError.type !== ErrorType.NETWORK || i === maxRetries - 1) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }

  throw lastError
}

/**
 * Checks if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const appError = mapSupabaseError(error)
  return appError.type === ErrorType.NETWORK || appError.type === ErrorType.SERVER
}

