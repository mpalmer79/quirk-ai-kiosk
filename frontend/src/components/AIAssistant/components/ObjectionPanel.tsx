import React from 'react';
import { styles } from '../styles';
import { OBJECTION_CATEGORIES } from '../constants';

interface ObjectionPanelProps {
  onSelectPrompt: (prompt: string) => void;
  onClose: () => void;
}

export const ObjectionPanel: React.FC<ObjectionPanelProps> = ({ onSelectPrompt, onClose }) => {
  return (
    <div style={styles.objectionPanel}>
      <div style={styles.objectionHeader}>
        <h3 style={styles.objectionTitle}>💡 Have Questions or Concerns?</h3>
        <p style={styles.objectionSubtitle}>Tap any category to see common questions I can answer</p>
      </div>
      
      <div style={styles.objectionCategories}>
        {OBJECTION_CATEGORIES.map((category) => (
          <div key={category.id} style={styles.objectionCategory}>
            <div style={styles.categoryHeader}>
              <span style={styles.categoryIcon}>{category.icon}</span>
              <span style={styles.categoryLabel}>{category.label}</span>
            </div>
            <div style={styles.categoryPrompts}>
              {category.prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  style={styles.objectionPromptButton}
                  onClick={() => {
                    onSelectPrompt(prompt);
                    onClose();
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        style={styles.closePanelButton}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default ObjectionPanel;
