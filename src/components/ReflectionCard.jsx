import { useState } from 'react';
import { useReflection } from '../store';

export default function ReflectionCard() {
  const { confirmReflection, reviseReflection } = useReflection();
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    confirmReflection();
  };

  const handleReviseClick = () => {
    setRevising(true);
  };

  const handleSubmitNote = () => {
    if (note.trim()) {
      reviseReflection(note.trim());
      setNote('');
      setRevising(false);
    }
  };

  return (
    <div className="card glass reflection-card">
      <div className="card-title">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Does this capture your work?
      </div>
      <div className="card-desc">Let me know if the interpretation above is accurate, or if there's anything to adjust.</div>

      <div className="reflection-actions">
        <button className="btn btn-confirm" onClick={handleConfirm}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Looks Accurate
        </button>
        <button className="btn btn-secondary" onClick={handleReviseClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Revise
        </button>
      </div>

      {revising && (
        <div className="revision-input">
          <input
            className="form-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. I also spend time on customer support…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitNote();
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSubmitNote} disabled={!note.trim()}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
