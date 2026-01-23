'use client'

import { ProficiencyLevel } from '@/lib/api/client'

interface HistoryItemProps {
  questionId: string
  questionText: string
  examType: 'FE' | 'AP'
  category: string
  correctCount: number
  incorrectCount: number
  proficiencyLevel: ProficiencyLevel
  lastAnsweredAt: string
  onRetry: (questionId: string, examType: 'FE' | 'AP') => void
}

const proficiencyLevelLabels: Record<ProficiencyLevel, string> = {
  master: '超得意',
  good: '得意',
  neutral: '普通',
  weak: '苦手',
  'very-weak': '超苦手',
}

const proficiencyLevelColors: Record<ProficiencyLevel, string> = {
  master: '#10b981', // 緑
  good: '#3b82f6', // 青
  neutral: '#6b7280', // グレー
  weak: '#f59e0b', // オレンジ
  'very-weak': '#ef4444', // 赤
}

export function HistoryItem({
  questionId,
  questionText,
  examType,
  category,
  correctCount,
  incorrectCount,
  proficiencyLevel,
  lastAnsweredAt,
  onRetry,
}: HistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${proficiencyLevelColors[proficiencyLevel]}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                background: proficiencyLevelColors[proficiencyLevel],
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              {proficiencyLevelLabels[proficiencyLevel]}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>{category}</span>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>{examType}</span>
          </div>

          <p style={{ marginBottom: '1rem', color: '#333', lineHeight: '1.6' }}>{questionText}</p>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
            <div>
              <span style={{ fontWeight: '600' }}>正答数:</span> {correctCount}回
            </div>
            <div>
              <span style={{ fontWeight: '600' }}>誤答数:</span> {incorrectCount}回
            </div>
            <div>
              <span style={{ fontWeight: '600' }}>最終回答:</span> {formatDate(lastAnsweredAt)}
            </div>
          </div>
        </div>

        <button
          onClick={() => onRetry(questionId, examType)}
          style={{
            padding: '0.5rem 1rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}
        >
          もう一度解く
        </button>
      </div>
    </div>
  )
}
