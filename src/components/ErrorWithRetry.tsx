'use client'

interface ErrorWithRetryProps {
  message: string
  onRetry: () => void
}

export function ErrorWithRetry({ message, onRetry }: ErrorWithRetryProps) {
  return (
    <div
      style={{
        padding: '1.5rem',
        background: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        marginBottom: '1rem',
        color: '#991b1b',
      }}
    >
      <p style={{ margin: '0 0 1rem 0' }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '0.5rem 1rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        再試行
      </button>
    </div>
  )
}
