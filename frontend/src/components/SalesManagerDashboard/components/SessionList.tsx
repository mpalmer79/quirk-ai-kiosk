/**
 * Session List Component
 */

import React from 'react';
import type { CustomerSession } from '../types';
import { styles } from '../styles';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  sessions: CustomerSession[];
  loading: boolean;
  selectedSessionId: string | null;
  onSelectSession: (session: CustomerSession) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  selectedSessionId,
  onSelectSession,
}) => {
  return (
    <div style={styles.sessionList}>
      <h3 style={styles.sessionListTitle}>Active Sessions ({sessions.length})</h3>
      
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <span>Loading sessions...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <span>No active sessions</span>
        </div>
      ) : (
        sessions.map(session => (
          <SessionCard
            key={session.sessionId}
            session={session}
            isActive={selectedSessionId === session.sessionId}
            onClick={() => onSelectSession(session)}
          />
        ))
      )}
    </div>
  );
};
