import { useState } from 'react';
import { useReflection, CORE_QUESTIONS, ADDITIONAL_QUESTIONS } from '../store';

export default function QuestionsCard({ additional = false }) {
  const { submitQuestions } = useReflection();
  const questions = additional ? ADDITIONAL_QUESTIONS : CORE_QUESTIONS;
  const [answers, setAnswers] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {})
  );

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allFilled = questions.every((q) => answers[q.id].trim());
    if (allFilled) {
      submitQuestions(answers, additional);
    }
  };

  const allFilled = questions.every((q) => answers[q.id].trim());

  return (
    <form className="card glass" onSubmit={handleSubmit}>
      <div className="card-title">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M12 7v5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {additional ? 'Additional Work Area' : 'Your Work'}
      </div>
      <div className="card-desc">
        {additional
          ? 'Describe this additional area of work.'
          : 'Answer a few quick questions about your day-to-day work.'}
      </div>

      <div className="form-group">
        {questions.map((q, idx) => (
          <div key={q.id} style={{ marginBottom: '20px' }}>
            <label className="form-label">
              <span className="q-number">{idx + 1}</span>
              {q.label}
            </label>
            <textarea
              className="form-textarea"
              value={answers[q.id]}
              onChange={(e) => handleChange(q.id, e.target.value)}
              placeholder={q.placeholder}
              required
            />
          </div>
        ))}
      </div>

      <div className="card-actions">
        <button className="btn btn-primary" type="submit" disabled={!allFilled}>
          {additional ? 'Add Area' : 'Share Reflection'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
