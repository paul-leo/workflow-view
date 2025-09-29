import React, { useState } from 'react';
import './InputPanel.css';

interface InputPanelProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  onSendMessage,
  placeholder = "Type command or message...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-panel">
      <form onSubmit={handleSubmit} className="input-panel__form">
        <div className="input-panel__input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="input-panel__textarea"
            rows={1}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="input-panel__send-button"
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
        
        <div className="input-panel__actions">
          <button
            type="button"
            className="input-panel__action-button"
            onClick={() => setMessage('')}
            disabled={!message}
            title="Clear input"
          >
            Clear
          </button>
          
          <button
            type="button"
            className="input-panel__action-button"
            title="Add file"
          >
            📎 Attach
          </button>
          
          <div className="input-panel__char-count">
            {message.length}/1000
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputPanel;
