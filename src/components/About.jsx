export default function About({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="about-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Brand */}
        <div className="about-brand">
          <div className="about-logo-wrap">
            <img src="/image.png" alt="Aligned Automation" className="about-logo-img" />
          </div>
          <h2 className="about-name">ReflectAI</h2>
          <p className="about-byline">by Business Transformation Services, Aligned Automation</p>
        </div>

        <div className="about-divider" />

        {/* Description */}
        <p className="about-description">
          ReflectAI is a structured work-reflection tool that helps professionals map, diagnose, and summarise
          what they actually do in their roles — through a natural, conversational AI experience.
          Walk away with a visual one-pager report complete with role diagnostics, growth areas, and upskilling recommendations.
        </p>

        {/* How it works */}
        <div className="about-steps-label">How it works</div>
        <div className="about-steps">
          <div className="about-step">
            <span className="about-step-num">01</span>
            <div>
              <div className="about-step-title">Share Your Context</div>
              <div className="about-step-desc">Tell ReflectAI your name, role, project, and how you spend your time day-to-day.</div>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">02</span>
            <div>
              <div className="about-step-title">AI Reflects Back</div>
              <div className="about-step-desc">Get a concise, insightful reflection on your work patterns and primary operating mode.</div>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">03</span>
            <div>
              <div className="about-step-title">Structured Diagnostic</div>
              <div className="about-step-desc">Receive a full breakdown — cognitive load, stakeholder map, context-switching, and more.</div>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">04</span>
            <div>
              <div className="about-step-title">Growth Recommendations</div>
              <div className="about-step-desc">Improvement pointers and curated upskilling courses tailored to your role and experience.</div>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">05</span>
            <div>
              <div className="about-step-title">Smart PDF Report</div>
              <div className="about-step-desc">Download a visual one-pager with charts, cards, and a professional branded layout.</div>
            </div>
          </div>
        </div>

        <div className="about-footer">
          <span className="about-footer-dot">·</span>
          <span>© {new Date().getFullYear()} Aligned Automation Services Pvt. Ltd.</span>
        </div>
      </div>
    </div>
  );
}
