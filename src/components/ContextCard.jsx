import { useState } from 'react';
import { useReflection } from '../store';

export default function ContextCard() {
  const { submitContext } = useReflection();
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role.trim() && project.trim()) {
      submitContext(role.trim(), project.trim());
    }
  };

  const isValid = role.trim() && project.trim();

  return (
    <form className="card glass" onSubmit={handleSubmit}>
      <div className="card-title">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Your Context
      </div>
      <div className="card-desc">Tell me about your role and project.</div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Your Role / Title</label>
          <input
            className="form-input"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior BA, Tech Lead, Product Manager…"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input
            className="form-input"
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="e.g. Project Phoenix, Platform Modernization…"
            required
          />
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-primary" type="submit" disabled={!isValid}>
          Continue
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
