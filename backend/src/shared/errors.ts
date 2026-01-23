/**
 * エラーコード定義
 */

export const ErrorCode = {
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INVALID_DATA: 'INVALID_DATA',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

export const ErrorMessage: Record<ErrorCodeType, string> = {
  [ErrorCode.INVALID_PARAMETER]: 'Invalid parameter',
  [ErrorCode.INVALID_DATA]: 'Invalid data',
  [ErrorCode.DATABASE_ERROR]: 'Database error',
  [ErrorCode.NOT_FOUND]: 'Not found',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
}

export function getHttpStatus(code: ErrorCodeType): number {
  const statusMap: Record<ErrorCodeType, number> = {
    [ErrorCode.INVALID_PARAMETER]: 400,
    [ErrorCode.INVALID_DATA]: 500,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.INTERNAL_ERROR]: 500,
  }
  return statusMap[code] || 500
}
