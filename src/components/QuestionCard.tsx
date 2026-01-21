'use client'

import { Question } from '@/types/question'

interface QuestionCardProps {
  question: Question
  currentIndex: number
  totalCount: number
  selectedAnswer: number | null
  onSelectAnswer: (index: number) => void
  onSubmitAnswer: () => void
  showResult: boolean
}

export function QuestionCard({
  question,
  currentIndex,
  totalCount,
  selectedAnswer,
  onSelectAnswer,
  onSubmitAnswer,
  showResult,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.answerIndex

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

      {showResult && (
        <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
          <h4>{isCorrect ? '✓ 正解！' : '✗ 不正解'}</h4>
          <p className="explanation">{question.explanation}</p>
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
        }
      `}</style>
    </div>
  )
}
