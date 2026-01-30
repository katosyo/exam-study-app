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
  isBookmarked?: boolean
  onToggleBookmark?: (questionId: string, examType: 'FE' | 'AP') => void
  note?: string
  onNoteChange?: (text: string) => void
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
  isBookmarked,
  onToggleBookmark,
  note,
  onNoteChange,
}: HistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      style={{
        background: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: `3px solid ${proficiencyLevelColors[proficiencyLevel]}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '0.15rem 0.6rem',
                background: proficiencyLevelColors[proficiencyLevel],
                color: 'white',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
              }}
            >
              {proficiencyLevelLabels[proficiencyLevel]}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>{category}</span>
            <span style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>{examType}</span>
          </div>

          <p style={{ marginBottom: '0.4rem', color: '#333', lineHeight: '1.4', fontSize: '0.9rem' }}>{questionText}</p>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#666', flexWrap: 'wrap' }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: '600' }}>正:</span> {correctCount}
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: '600' }}>誤:</span> {incorrectCount}
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: '600' }}>最終:</span> {formatDate(lastAnsweredAt)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(questionId, examType)}
              title={isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
              style={{
                padding: '0.35rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              {isBookmarked ? '⭐' : '☆'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onRetry(questionId, examType)}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            もう一度解く
          </button>
        </div>
      </div>
      {onNoteChange && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
          <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>メモ</label>
          <textarea
            value={note ?? ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="メモを入力..."
            rows={2}
            style={{
              width: '100%',
              padding: '0.4rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.85rem',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}
