/**
 * Worksheet Card Component
 */

import React from 'react';
import type { WorksheetData } from '../types';
import { styles } from '../styles';
import { formatCurrency, getLeadScoreBadge, getStatusBadge } from '../utils';

interface WorksheetCardProps {
  worksheet: WorksheetData;
  isActive: boolean;
  onClick: () => void;
}

export const WorksheetCard: React.FC<WorksheetCardProps> = ({ worksheet, isActive, onClick }) => {
  const leadBadge = getLeadScoreBadge(worksheet.lead_score);
  const statusBadge = getStatusBadge(worksheet.status);
  
  return (
    <div
      style={{
        ...styles.card,
        ...(isActive ? styles.cardActive : {}),
        borderLeft: `4px solid ${leadBadge.color}`,
      }}
      onClick={onClick}
    >
      {/* Lead Score & Status Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{
          ...styles.badge,
          background: leadBadge.bg,
          color: leadBadge.color,
        }}>
          {leadBadge.icon} {leadBadge.label} ({worksheet.lead_score})
        </span>
        <span style={{
          ...styles.badgeSmall,
          background: statusBadge.bg,
          color: statusBadge.color,
        }}>
          {statusBadge.label}
        </span>
      </div>
      
      {/* Customer & Vehicle */}
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>
          {worksheet.customer_name || 'Guest Customer'}
        </span>
        <span style={styles.cardTime}>
          {formatCurrency(worksheet.monthly_payment)}/mo
        </span>
      </div>
      
      <div style={styles.cardMeta}>
        <span style={styles.cardVehicle}>
          🚗 {worksheet.vehicle.year} {worksheet.vehicle.model} {worksheet.vehicle.trim || ''}
        </span>
        <span style={styles.cardStep}>
          ${worksheet.down_payment.toLocaleString()} down • Stock #{worksheet.vehicle.stock_number}
        </span>
      </div>
    </div>
  );
};
