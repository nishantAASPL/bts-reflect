import { useState } from 'react';
import { useReflection } from '../store';
import About from './About';

const STEPS = ['Context', 'Questions', 'Reflect', 'Expand', 'Report'];

export default function Header() {
  const { step, restart } = useReflection();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          {/* Brand */}
          <div className="header-brand">
            <img src="/image.png" alt="Aligned Automation Services" className="header-logo" style={{ maxWidth: '28px', height: 'auto' }} />
            <span className="header-title">ReflectAI</span>
          </div>

          {/* Step Indicator */}
          <nav className="steps" aria-label="Progress">
            {STEPS.map((label, i) => {
              const stepNum = i + 1;
              const isDone = step > stepNum;
              const isActive = step === stepNum;
              return (
                <span key={label}>
                  {i > 0 && <span className="step-line" />}
                  <span className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                    <span className="step-dot" />
                    <span className="step-label">{label}</span>
                  </span>
                </span>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setAboutOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              About
            </button>

            <button className="btn btn-ghost btn-sm" onClick={restart}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 1 1.76 4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </header>

      <About isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
