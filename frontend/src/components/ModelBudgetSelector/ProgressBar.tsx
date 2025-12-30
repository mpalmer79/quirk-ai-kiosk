import React from 'react';
import styles from '../modelBudgetSelectorStyles';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  return (
    <div style={styles.progressBar}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div 
          key={i} 
          style={{
            ...styles.progressDot,
            ...(i + 1 <= currentStep ? styles.progressDotActive : {}),
            ...(i + 1 < currentStep ? styles.progressDotComplete : {}),
          }} 
        />
      ))}
    </div>
  );
};

export default ProgressBar;
