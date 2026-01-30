'use client'

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = '読み込み中...' }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <div
        className="loading-spinner"
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#0070f3',
          borderRadius: '50%',
        }}
      />
      {message && <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{message}</p>}
    </div>
  )
}
