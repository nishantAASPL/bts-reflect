import { useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { useReflection } from '../store';
import MessageBubble from './MessageBubble';
import ThinkingDots from './ThinkingDots';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

marked.setOptions({ gfm: true, breaks: true });

export default function ChatView() {
  const { messages, streaming, thinking, typing, error, dismissError } = useReflection();
  const bottomRef = useRef(null);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streaming.text, thinking]);

  /* streaming message rendered via marked */
  const streamHtml = useMemo(
    () => (streaming.text ? marked.parse(streaming.text) : ''),
    [streaming.text],
  );

  return (
    <>
      <main className="chat">
        <div className="messages">
          {/* Past messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} type={msg.type} content={msg.content} />
          ))}

          {/* Typing indicator - shows while bot is "thinking" before response */}
          {typing && <TypingIndicator />}

          {/* Thinking indicator - shows during streaming */}
          {thinking && <ThinkingDots />}

          {/* Streaming AI response */}
          {streaming.active && (
            <div className="message ai">
              <div className="message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {/* Bot icon */}
                  <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                  <path d="M8 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="message-body glass-thin">
                <div
                  className="markdown-body streaming-cursor"
                  dangerouslySetInnerHTML={{ __html: streamHtml }}
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Chat Input Footer */}
      <ChatInput />

      {/* Error toast */}
      {error && (
        <div className="toast-layer">
          <div className="toast">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--red)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="toast-msg">{error}</span>
            <button className="toast-close" onClick={dismissError}>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
