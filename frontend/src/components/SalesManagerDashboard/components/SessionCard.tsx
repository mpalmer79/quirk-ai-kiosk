/**
 * Session Card Component
 */

import React from 'react';
import type { CustomerSession } from '../types';
import { styles } from '../styles';
import { getTimeSince, getStepLabel } from '../utils';

interface SessionCardProps {
  session: CustomerSession;
  isActive: boolean;
  onClick: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, isActive, onClick }) => {
  return (
    <div
      style={{
        ...styles.card,
        ...(isActive ? styles.cardActive : {}),
      }}
      onClick={onClick}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>
          {session.customerName || 'Guest Customer'}
        </span>
        <span style={styles.cardTime}>{getTimeSince(session.lastActivity)}</span>
      </div>
      <div style={styles.cardMeta}>
        <span style={styles.cardStep}>{getStepLabel(session.currentStep)}</span>
        {session.selectedVehicle?.model && (
          <span style={styles.cardVehicle}>
            🚗 {session.selectedVehicle.year} {session.selectedVehicle.model}
          </span>
        )}
      </div>
    </div>
  );
};
