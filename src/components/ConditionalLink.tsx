'use client'

/**
 * 条件付きリンクコンポーネント
 * 
 * ログイン状態に応じてリンクを有効/無効にする
 */

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface ConditionalLinkProps {
  href: string
  children: React.ReactNode
  requireAuth?: boolean
  className?: string
  style?: React.CSSProperties
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void
}

export function ConditionalLink({
  href,
  children,
  requireAuth = false,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}: ConditionalLinkProps) {
  const { isLoggedIn } = useAuth()
  const isDisabled = requireAuth && !isLoggedIn

  const disabledStyle: React.CSSProperties = isDisabled
    ? {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none',
        position: 'relative',
      }
    : {}

  const combinedStyle = { ...style, ...disabledStyle }

  if (isDisabled) {
    return (
      <div
        className={className}
        style={combinedStyle}
        title="ログイン後に利用できます"
        onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLDivElement>}
        onMouseLeave={onMouseLeave as React.MouseEventHandler<HTMLDivElement>}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
            zIndex: 1000,
          }}
          className="tooltip"
        >
          ログイン後に利用できます
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={className}
      style={combinedStyle}
      onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLAnchorElement>}
      onMouseLeave={onMouseLeave as React.MouseEventHandler<HTMLAnchorElement>}
    >
      {children}
    </Link>
  )
}
