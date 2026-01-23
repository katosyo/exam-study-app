'use client'

import { ProficiencyLevel } from '@/lib/api/client'

interface HistoryFilterProps {
  selectedCategory: string | null
  selectedProficiencyLevel: ProficiencyLevel | null
  selectedExamType: 'FE' | 'AP' | null
  categories: string[]
  onCategoryChange: (category: string | null) => void
  onProficiencyLevelChange: (level: ProficiencyLevel | null) => void
  onExamTypeChange: (examType: 'FE' | 'AP' | null) => void
}

const proficiencyLevelLabels: Record<ProficiencyLevel, string> = {
  master: '超得意',
  good: '得意',
  neutral: '普通',
  weak: '苦手',
  'very-weak': '超苦手',
}

const proficiencyLevelColors: Record<ProficiencyLevel, string> = {
  master: '#10b981',
  good: '#3b82f6',
  neutral: '#6b7280',
  weak: '#f59e0b',
  'very-weak': '#ef4444',
}

export function HistoryFilter({
  selectedCategory,
  selectedProficiencyLevel,
  selectedExamType,
  categories,
  onCategoryChange,
  onProficiencyLevelChange,
  onExamTypeChange,
}: HistoryFilterProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
        フィルタ
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* 試験種別フィルタ */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            試験種別
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onExamTypeChange(null)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedExamType === null ? '#0070f3' : '#e5e7eb',
                color: selectedExamType === null ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: selectedExamType === null ? '600' : 'normal',
              }}
            >
              すべて
            </button>
            <button
              onClick={() => onExamTypeChange('FE')}
              style={{
                padding: '0.5rem 1rem',
                background: selectedExamType === 'FE' ? '#0070f3' : '#e5e7eb',
                color: selectedExamType === 'FE' ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: selectedExamType === 'FE' ? '600' : 'normal',
              }}
            >
              FE
            </button>
            <button
              onClick={() => onExamTypeChange('AP')}
              style={{
                padding: '0.5rem 1rem',
                background: selectedExamType === 'AP' ? '#0070f3' : '#e5e7eb',
                color: selectedExamType === 'AP' ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: selectedExamType === 'AP' ? '600' : 'normal',
              }}
            >
              AP
            </button>
          </div>
        </div>

        {/* ジャンルフィルタ */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            ジャンル
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 得意度フィルタ */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            得意度
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={() => onProficiencyLevelChange(null)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedProficiencyLevel === null ? '#0070f3' : '#e5e7eb',
                color: selectedProficiencyLevel === null ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: selectedProficiencyLevel === null ? '600' : 'normal',
              }}
            >
              すべて
            </button>
            {(['master', 'good', 'neutral', 'weak', 'very-weak'] as ProficiencyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => onProficiencyLevelChange(level)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedProficiencyLevel === level ? proficiencyLevelColors[level] : '#e5e7eb',
                  color: selectedProficiencyLevel === level ? 'white' : '#333',
                  border: selectedProficiencyLevel === level ? `2px solid ${proficiencyLevelColors[level]}` : '2px solid transparent',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: selectedProficiencyLevel === level ? '600' : 'normal',
                }}
              >
                {proficiencyLevelLabels[level]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
