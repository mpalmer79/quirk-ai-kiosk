/**
 * Worksheet Detail Component - Manager view with counter-offer
 */

import React, { useState } from 'react';
import type { WorksheetData } from '../types';
import { styles } from '../styles';
import { formatCurrency, getLeadScoreBadge, getStatusBadge } from '../utils';

interface WorksheetDetailProps {
  worksheet: WorksheetData;
  onClose: () => void;
  onSendCounterOffer: (worksheetId: string, adjustment: number, notes: string) => Promise<boolean>;
  onAcceptDeal: (worksheetId: string) => Promise<boolean>;
  sendingCounterOffer: boolean;
}

export const WorksheetDetail: React.FC<WorksheetDetailProps> = ({
  worksheet,
  onClose,
  onSendCounterOffer,
  onAcceptDeal,
  sendingCounterOffer,
}) => {
  const [counterOfferAmount, setCounterOfferAmount] = useState(0);
  const [counterOfferNotes, setCounterOfferNotes] = useState('');
  
  const leadBadge = getLeadScoreBadge(worksheet.lead_score);
  const statusBadge = getStatusBadge(worksheet.status);

  const handleSendCounterOffer = async () => {
    if (!counterOfferAmount && !counterOfferNotes) return;
    
    const success = await onSendCounterOffer(worksheet.id, counterOfferAmount, counterOfferNotes);
    if (success) {
      setCounterOfferAmount(0);
      setCounterOfferNotes('');
      alert('Counter-offer sent to customer!');
    } else {
      alert('Failed to send counter-offer');
    }
  };

  const handleAcceptDeal = async () => {
    const success = await onAcceptDeal(worksheet.id);
    if (success) {
      alert('Deal accepted! 🎉');
    }
  };

  return (
    <div style={styles.worksheet}>
      {/* Header */}
      <div style={styles.worksheetHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={styles.worksheetTitle}>Digital Worksheet</h3>
            <span style={{
              ...styles.badge,
              padding: '4px 12px',
              fontSize: '13px',
              background: leadBadge.bg,
              color: leadBadge.color,
            }}>
              {leadBadge.icon} Lead Score: {worksheet.lead_score}
            </span>
            <span style={{
              ...styles.badgeSmall,
              padding: '4px 12px',
              background: statusBadge.bg,
              color: statusBadge.color,
            }}>
              {statusBadge.label}
            </span>
          </div>
          <p style={styles.worksheetCustomer}>
            {worksheet.customer_name || 'Guest Customer'}
            {worksheet.customer_phone && ` • ${worksheet.customer_phone}`}
          </p>
        </div>
        <div style={styles.worksheetActions}>
          <button style={styles.actionBtn} onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Deal Structure Grid */}
      <div style={styles.worksheetGrid}>
        {/* Vehicle */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>🚗</span> Vehicle
          </h4>
          <div style={styles.sectionContent}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
              {worksheet.vehicle.year} {worksheet.vehicle.make} {worksheet.vehicle.model}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>{worksheet.vehicle.trim}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Stock #{worksheet.vehicle.stock_number}</div>
            <div style={{ ...styles.priceRow, marginTop: '12px' }}>
              <span>Selling Price</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(worksheet.selling_price)}</span>
            </div>
          </div>
        </div>

        {/* Deal Numbers */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>💰</span> Deal Structure
          </h4>
          <div style={styles.sectionContent}>
            <div style={styles.priceRow}>
              <span>Down Payment</span>
              <span>{formatCurrency(worksheet.down_payment)}</span>
            </div>
            {worksheet.has_trade && (
              <div style={styles.priceRow}>
                <span>Trade Equity</span>
                <span style={worksheet.trade_equity >= 0 ? styles.positiveValue : styles.negativeValue}>
                  {worksheet.trade_equity >= 0 ? '+' : ''}{formatCurrency(worksheet.trade_equity)}
                </span>
              </div>
            )}
            <div style={styles.priceRow}>
              <span>Term</span>
              <span>{worksheet.selected_term || 72} months</span>
            </div>
            <div style={{ ...styles.equityRow }}>
              <span>Monthly Payment</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                {formatCurrency(worksheet.monthly_payment)}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Counter Offer Section */}
      {worksheet.status !== 'accepted' && (
        <div style={{ ...styles.section, marginTop: '20px' }}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>💬</span> Send Counter-Offer
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div style={styles.editableRow}>
              <label style={styles.editableLabel}>Discount Amount ($)</label>
              <input
                type="number"
                value={counterOfferAmount || ''}
                onChange={(e) => setCounterOfferAmount(Number(e.target.value) || 0)}
                style={styles.editableInput}
                placeholder="e.g., 2000"
              />
            </div>
            <div style={styles.editableRow}>
              <label style={styles.editableLabel}>Message to Customer</label>
              <input
                type="text"
                value={counterOfferNotes}
                onChange={(e) => setCounterOfferNotes(e.target.value)}
                style={styles.editableInput}
                placeholder="e.g., Manager special - today only!"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              style={{
                ...styles.actionBtnBlue,
                opacity: sendingCounterOffer ? 0.6 : 1,
              }}
              onClick={handleSendCounterOffer}
              disabled={sendingCounterOffer}
            >
              {sendingCounterOffer ? '⏳ Sending...' : '📤 Send Counter-Offer'}
            </button>
            {worksheet.status === 'ready' && (
              <button style={styles.actionBtnPrimary} onClick={handleAcceptDeal}>
                ✅ Accept Deal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previous Notes */}
      {worksheet.manager_notes && (
        <div style={{ ...styles.notesBox, marginTop: '20px' }}>
          <h4 style={styles.boxTitle}>Previous Notes</h4>
          <p style={{ margin: 0, color: '#1a1a2e' }}>{worksheet.manager_notes}</p>
        </div>
      )}
    </div>
  );
};
