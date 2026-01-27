/**
 * Worksheet List Component
 */

import React from 'react';
import type { WorksheetData } from '../types';
import { styles } from '../styles';
import { WorksheetCard } from './WorksheetCard';

interface WorksheetListProps {
  worksheets: WorksheetData[];
  loading: boolean;
  selectedWorksheetId: string | null;
  onSelectWorksheet: (worksheet: WorksheetData) => void;
}

export const WorksheetList: React.FC<WorksheetListProps> = ({
  worksheets,
  loading,
  selectedWorksheetId,
  onSelectWorksheet,
}) => {
  // Sort by lead score descending
  const sortedWorksheets = [...worksheets].sort((a, b) => b.lead_score - a.lead_score);
  
  return (
    <div style={styles.sessionList}>
      <h3 style={styles.sessionListTitle}>Active Worksheets ({worksheets.length})</h3>
      
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <span>Loading worksheets...</span>
        </div>
      ) : worksheets.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📋</span>
          <span>No active worksheets</span>
          <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            Worksheets appear when customers start building deals
          </span>
        </div>
      ) : (
        sortedWorksheets.map(worksheet => (
          <WorksheetCard
            key={worksheet.id}
            worksheet={worksheet}
            isActive={selectedWorksheetId === worksheet.id}
            onClick={() => onSelectWorksheet(worksheet)}
          />
        ))
      )}
    </div>
  );
};
