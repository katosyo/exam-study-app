/**
 * Result 型
 * 
 * 例外を投げない設計のための型定義
 */

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError }

export interface AppError {
  code: string
  message: string
  details?: unknown
}

export function success<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function failure<T>(code: string, message: string, details?: unknown): Result<T> {
  return {
    ok: false,
    error: { code, message, details },
  }
}
