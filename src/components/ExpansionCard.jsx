import { useState } from 'react';
import { useReflection } from '../store';

export default function ExpansionCard() {
  const { expandYes, expandNo } = useReflection();
  const [loading, setLoading] = useState(false);

  const handleYes = () => {
    expandYes();
  };

  const handleNo = async () => {
    setLoading(true);
    expandNo();
  };

  return (
    <div className="card glass expansion-card">
      <div className="card-title">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Any Other Major Work?
      </div>
      <div className="card-desc">Is there another significant type of work we haven't covered yet?</div>

      <div className="expansion-actions">
        <button className="btn btn-primary btn-lg" onClick={handleYes} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Yes, There's More
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={handleNo}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="15.7 47.1" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              No, That's Everything
            </>
          )}
        </button>
      </div>
    </div>
  );
}
