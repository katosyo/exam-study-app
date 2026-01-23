'use client'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
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
    </div>
  )
}
