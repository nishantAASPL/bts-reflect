import { useState, useEffect } from 'react';
import { useReflection } from '../store';
import { generateDynamicGreeting } from '../utils';

export default function Landing() {
  const { start } = useReflection();
  const [exiting, setExiting] = useState(false);
  const [dynamicSubtitle, setDynamicSubtitle] = useState(null);

  useEffect(() => {
    generateDynamicGreeting().then((greeting) => {
      if (greeting) setDynamicSubtitle(greeting);
    });
  }, []);

  const handleStart = () => {
    setExiting(true);
    setTimeout(start, 500);
  };

  return (
    <div className={`landing ${exiting ? 'exiting' : ''}`}>
      {/* Animated background orbs */}
      <div className="landing-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="landing-content">
        <div className="logo-mark">
          <img src="/image.png" alt="Aligned Automation Services" style={{ maxWidth: '90px', height: 'auto' }} />
        </div>

        <h1 className="landing-title">
          <span className="accent-text">ReflectAI</span>
        </h1>
        <p className="landing-byline">by Business Transformation Services, Aligned Automation</p>

        <p className="landing-subtitle">
          {dynamicSubtitle || (
            <>
              Structured work reflection, powered by AI.
              <br />
              Discover what you actually do — mapped, diagnosed, and summarised.
            </>
          )}
        </p>

        <button className="btn btn-primary btn-lg" onClick={handleStart}>
          Begin Reflection
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10h12m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <p className="landing-hint">Takes about 5–8 minutes</p>
      </div>
    </div>
  );
}
