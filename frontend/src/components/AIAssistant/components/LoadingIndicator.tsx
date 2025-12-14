import React from 'react';
import { styles } from '../styles';

export const LoadingIndicator: React.FC = () => {
  return (
    <div style={styles.messageWrapper}>
      <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
        <div style={styles.loadingDots}>
          <span style={{ ...styles.dot, animationDelay: '0s' }}>●</span>
          <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
          <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
