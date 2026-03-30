import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

export default function MessageBubble({ type, content }) {
  const html = useMemo(() => marked.parse(content || ''), [content]);

  return (
    <div className={`message ${type}`}>
      <div className="message-avatar">
        {type === 'ai' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            {/* Bot icon */}
            <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="10" r="1.5" fill="currentColor" />
            <circle cx="16" cy="10" r="1.5" fill="currentColor" />
            <path d="M8 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <div className="message-body">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
