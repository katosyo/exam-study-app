'use client'

import { Question } from '@/types/question'
import { SubmitAnswerResponse } from '@/lib/api/client'

interface QuestionCardProps {
  question: Question
  currentIndex: number
  totalCount: number
  selectedAnswer: number | null
  onSelectAnswer: (index: number) => void
  onSubmitAnswer: () => void
  showResult: boolean
  answerResult?: SubmitAnswerResponse['result'] | null
}

const proficiencyLevelLabels = {
  'master': '超得意',
  'good': '得意',
  'neutral': '普通',
  'weak': '苦手',
  'very-weak': '超苦手',
}

const proficiencyLevelColors = {
  'master': '#10b981',
  'good': '#3b82f6',
  'neutral': '#6b7280',
  'weak': '#f59e0b',
  'very-weak': '#ef4444',
}

export function QuestionCard({
  question,
  currentIndex,
  totalCount,
  selectedAnswer,
  onSelectAnswer,
  onSubmitAnswer,
  showResult,
  answerResult,
}: QuestionCardProps) {
  const isCorrect = answerResult?.isCorrect ?? (selectedAnswer === question.answerIndex)

  return (
    <div className="question-card">
      <div className="header">
        <span className="progress">
          {currentIndex + 1} / {totalCount}
        </span>
        <span className="category">{question.category || '一般'}</span>
      </div>

      <h3 className="question-text">{question.text}</h3>

      <div className="choices">
        {question.choices.map((choice, index) => {
          const isSelected = selectedAnswer === index
          const isAnswer = index === question.answerIndex
          let className = 'choice'
          if (showResult) {
            if (isAnswer) className += ' correct'
            else if (isSelected) className += ' incorrect'
          } else if (isSelected) {
            className += ' selected'
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => !showResult && onSelectAnswer(index)}
              disabled={showResult}
            >
              <span className="choice-label">{['ア', 'イ', 'ウ', 'エ'][index]}</span>
              <span className="choice-text">{choice}</span>
            </button>
          )
        })}
      </div>

      {!showResult && selectedAnswer !== null && (
        <button className="btn-submit" onClick={onSubmitAnswer}>
          回答する
        </button>
      )}

      {showResult && answerResult && (
        <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
          <h4>{isCorrect ? '✓ 正解！' : '✗ 不正解'}</h4>
          <p className="explanation">{answerResult.explanation}</p>
          
          <div className="stats">
            <h5>📊 この問題の統計</h5>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">正解数:</span>
                <span className="stat-value">{answerResult.stats.correctCount}回</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">不正解数:</span>
                <span className="stat-value">{answerResult.stats.incorrectCount}回</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">得意度:</span>
                <span 
                  className="stat-value proficiency"
                  style={{ 
                    color: proficiencyLevelColors[answerResult.stats.proficiencyLevel],
                    fontWeight: 'bold'
                  }}
                >
                  {proficiencyLevelLabels[answerResult.stats.proficiencyLevel]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .question-card {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #666;
        }
        .question-text {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #333;
        }
        .choices {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .choice {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .choice:hover:not(:disabled) {
          border-color: #0070f3;
          background: #f0f8ff;
        }
        .choice.selected {
          border-color: #0070f3;
          background: #e6f2ff;
        }
        .choice.correct {
          border-color: #10b981;
          background: #d1fae5;
        }
        .choice.incorrect {
          border-color: #ef4444;
          background: #fee2e2;
        }
        .choice:disabled {
          cursor: default;
        }
        .choice-label {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f3f4f6;
          font-weight: 600;
        }
        .choice-text {
          flex: 1;
          line-height: 1.5;
        }
        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-submit:hover {
          background: #0051cc;
        }
        .result {
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1.5rem;
        }
        .result.correct {
          background: #d1fae5;
          border: 2px solid #10b981;
        }
        .result.incorrect {
          background: #fee2e2;
          border: 2px solid #ef4444;
        }
        .result h4 {
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        .explanation {
          line-height: 1.6;
          color: #333;
          margin-bottom: 1.5rem;
        }
        .stats {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .stats h5 {
          margin-bottom: 1rem;
          font-size: 1rem;
          color: #555;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .stat-label {
          font-size: 0.85rem;
          color: #666;
        }
        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
        .stat-value.proficiency {
          font-size: 1.2rem;
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
