import { useState, useRef, useEffect } from 'react';
import { useReflection } from '../store';

export default function ChatInput() {
  const { phase, submitUserInput, streaming, thinking, restart } = useReflection();
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const isDisabled = streaming.active || thinking;
  const isComplete = phase === 'complete';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isDisabled) {
      submitUserInput(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    if (!isDisabled) {
      inputRef.current?.focus();
    }
  }, [isDisabled]);

  if (isComplete) {
    return (
      <div className="chat-input-footer">
        <div className="chat-input-container">
          <button className="btn-pill btn-pill-primary" onClick={restart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 8a6 6 0 1 1 1.76 4.24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 4v4h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-input-footer">
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="message-input-wrapper">
            <input
              ref={inputRef}
              className="message-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your response…"
              disabled={isDisabled}
              autoFocus
            />
            <button
              className={`btn-send ${!input.trim() || isDisabled ? 'disabled' : 'active'}`}
              type="submit"
              disabled={!input.trim() || isDisabled}
              title={isDisabled ? 'Waiting for response…' : 'Send'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.05554831 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.08564352 0.837654326,3.01 1.15159189,3.97946707 L3.03521743,10.4205161 C3.03521743,10.5776134 3.19218622,10.7347108 3.50612381,10.7347108 L16.6915026,11.5202 C16.6915026,11.5202 17.1624089,11.5202 17.1624089,12.0 C17.1624089,12.4798 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
