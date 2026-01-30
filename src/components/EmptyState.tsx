'use client'

interface EmptyStateProps {
  message: string
  subMessage?: string
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '4rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
      <p style={{ fontSize: '1.2rem', color: '#666', margin: 0 }}>{message}</p>
      {subMessage && (
        <p style={{ fontSize: '0.9rem', color: '#999', margin: '0.5rem 0 0 0' }}>{subMessage}</p>
      )}
    </div>
  )
}
