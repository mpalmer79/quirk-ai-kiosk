/**
 * Placeholder Component
 */

import React from 'react';
import { styles } from '../styles';

interface PlaceholderProps {
  icon: string;
  title: string;
  text: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ icon, title, text }) => {
  return (
    <div style={styles.placeholder}>
      <span style={styles.placeholderIcon}>{icon}</span>
      <h3 style={styles.placeholderTitle}>{title}</h3>
      <p style={styles.placeholderText}>{text}</p>
    </div>
  );
};
