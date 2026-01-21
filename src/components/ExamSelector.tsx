'use client'

import { ExamType } from '@/types/question'

interface ExamSelectorProps {
  onStart: (examType: ExamType, limit: number) => void
}

export function ExamSelector({ onStart }: ExamSelectorProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const examType = formData.get('examType') as ExamType
    const limit = parseInt(formData.get('limit') as string, 10)
    onStart(examType, limit)
  }

  return (
    <form onSubmit={handleSubmit} className="exam-selector">
      <h2>試験設定</h2>

      <div className="form-group">
        <label htmlFor="examType">試験種別</label>
        <select name="examType" id="examType" required>
          <option value="FE">基本情報技術者試験（FE）</option>
          <option value="AP">応用情報技術者試験（AP）</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="limit">出題数</label>
        <select name="limit" id="limit" required>
          <option value="5">5問</option>
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="30">30問</option>
          <option value="50">50問</option>
        </select>
      </div>

      <button type="submit" className="btn-primary">
        クイズを開始
      </button>

      <style jsx>{`
        .exam-selector {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        h2 {
          margin-bottom: 1.5rem;
          color: #333;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #555;
        }
        select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        .btn-primary {
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
        .btn-primary:hover {
          background: #0051cc;
        }
      `}</style>
    </form>
  )
}
