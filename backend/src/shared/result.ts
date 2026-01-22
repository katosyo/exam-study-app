/**
 * Result 型
 * 
 * 例外を投げない設計のための型定義
 */

import { ErrorCodeType } from './errors'

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError }

export interface AppError {
  code: ErrorCodeType
  message: string
  details?: unknown
}

export function success<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function failure<T>(code: ErrorCodeType, message: string, details?: unknown): Result<T> {
  return {
    ok: false,
    error: { code, message, details },
  }
}
