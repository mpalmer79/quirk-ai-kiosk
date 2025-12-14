import React from 'react';
import { styles } from '../styles';
import { SUGGESTED_PROMPTS } from '../constants';

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSelect }) => {
  return (
    <div style={styles.suggestionsContainer}>
      <p style={styles.suggestionsLabel}>Try asking me:</p>
      <div style={styles.suggestionsGrid}>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            style={styles.suggestionButton}
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionChips;
