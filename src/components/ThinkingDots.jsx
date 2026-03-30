export default function ThinkingDots() {
  return (
    <div className="thinking">
      <div className="message-avatar" style={{ background: 'var(--accent-gradient)' }}>
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
          <path d="M14 16h20v3H14zm0 6.5h14v3H14zm0 6.5h18v3H14z" fill="#fff" opacity=".9" />
        </svg>
      </div>
      <div className="thinking-dots">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </div>
  );
}
