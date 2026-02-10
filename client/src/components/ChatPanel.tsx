import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from 'shared';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

export function ChatPanel({ messages, onSend, onFocusChange }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  }, [input, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
    e.stopPropagation();
  }, [handleSend]);

  return (
    <div className="chat-panel">
      <div className="chat-header">Chat</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            {msg.sender === 'system' ? (
              <span className="chat-system">{msg.text}</span>
            ) : (
              <>
                <span className="chat-sender">{msg.senderName}:</span>
                <span className="chat-text">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="Enter로 채팅..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          maxLength={200}
        />
        <button className="chat-send-btn" onClick={handleSend}>
          전송
        </button>
      </div>
    </div>
  );
}
