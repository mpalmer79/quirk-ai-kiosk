import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { styles } from '../styles';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onMicClick: () => void;
  isListening: boolean;
  isLoading: boolean;
  onStartOver: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onMicClick,
  isListening,
  isLoading,
  onStartOver,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onSend();
    }
  };

  return (
    <>
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          placeholder="Type your message or tap the microphone next to the blue arrow to talk to me..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        
        {/* Microphone Button */}
        <button
          style={{
            ...styles.micButton,
            ...(isListening ? styles.micButtonActive : {}),
          }}
          onClick={onMicClick}
          disabled={isLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
        
        {/* Send Button */}
        <button
          style={styles.sendButton}
          onClick={onSend}
          disabled={isLoading || !value.trim()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      
      {/* Start Over Button */}
      <div style={styles.startOverContainer}>
        <button style={styles.startOverButton} onClick={onStartOver}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Start Over
        </button>
      </div>
      
      {/* Transcript Notice */}
      <div style={{
        textAlign: 'center' as const,
        padding: '8px 0 16px 0',
        fontSize: '12px',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        Transcript available upon request
      </div>
    </>
  );
};

export default ChatInput;
