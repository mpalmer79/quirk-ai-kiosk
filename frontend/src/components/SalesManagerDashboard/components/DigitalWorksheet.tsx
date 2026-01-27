/**
 * Digital Worksheet Component - Session-based view for managers
 * Shows deal structure when a session is selected
 */

import React, { useState } from 'react';
import api from '../../api';
import type { CustomerSession, SessionDetail, DealOverrides } from '../types';
import { styles } from '../styles';
import { 
  formatCurrency, 
  calculateFinancePayment, 
  calculateLeasePayment 
} from '../utils';
import { DEFAULT_FINANCE_TERMS, DEFAULT_LEASE_TERMS } from '../constants';
import { useChatAnalysis } from '../hooks';

interface DigitalWorksheetProps {
  session: CustomerSession;
  sessionDetail: SessionDetail | null;
  overrides: DealOverrides;
  setOverrides: React.Dispatch<React.SetStateAction<DealOverrides>>;
  managerNotes: string;
  setManagerNotes: React.Dispatch<React.SetStateAction<string>>;
  onViewChat: () => void;
}

export const DigitalWorksheet: React.FC<DigitalWorksheetProps> = ({
  session,
  sessionDetail,
  overrides,
  setOverrides,
  managerNotes,
  setManagerNotes,
  onViewChat,
}) => {
  const [paymentMode, setPaymentMode] = useState<'finance' | 'lease'>('finance');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  
  const { extractVehicles, extractTradeIn, extractPaymentInfo } = useChatAnalysis();

  const handleOverrideChange = (field: keyof DealOverrides, value: number | null) => {
    setOverrides(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveNotes = async () => {
    if (!session || !managerNotes.trim()) return;
    
    setSavingNotes(true);
    setNotesSaved(false);
    
    try {
      await api.logTrafficSession({
        sessionId: session.sessionId,
        managerNotes: managerNotes,
        currentStep: session.currentStep,
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePrint = () => window.print();

  const handleSendToFI = () => {
    alert('Send to F&I functionality would integrate with your DMS (PBS/Reynolds/CDK)');
  };

  // Computed values
  const vehicle = session.selectedVehicle;
  const trade = session.tradeIn;
  
  const salePrice = overrides.salePrice ?? vehicle?.price ?? 0;
  const msrp = vehicle?.msrp ?? salePrice * 1.05;
  const tradeACV = overrides.tradeACV ?? trade?.estimatedValue ?? 0;
  const payoff = trade?.payoffAmount ?? 0;
  const equity = tradeACV - payoff;
  const downPayment = overrides.downPayment ?? 0;

  const financePrincipal = salePrice - Math.max(0, equity) - downPayment + overrides.adminFee;
  const finance = calculateFinancePayment(financePrincipal, overrides.financeAPR, overrides.financeTerm);
  const lease = calculateLeasePayment(
    msrp,
    salePrice,
    downPayment + Math.max(0, equity),
    overrides.leaseTerm,
    overrides.leaseResidual,
    overrides.leaseMoneyFactor
  );

  // Extract info from chat
  const vehiclesFromChat = extractVehicles(sessionDetail?.chatHistory);
  const tradeFromChat = extractTradeIn(sessionDetail?.chatHistory);
  const paymentFromChat = extractPaymentInfo(sessionDetail?.chatHistory);

  return (
    <div style={styles.worksheet}>
      {/* Header */}
      <div style={styles.worksheetHeader}>
        <div>
          <h3 style={styles.worksheetTitle}>Digital Worksheet</h3>
          <p style={styles.worksheetCustomer}>
            {session.customerName || 'Guest Customer'}
            {session.phone && ` • ${session.phone}`}
          </p>
        </div>
        <div style={styles.worksheetActions}>
          {sessionDetail?.chatHistory && sessionDetail.chatHistory.length > 0 && (
            <button style={styles.viewChatBtn} onClick={onViewChat}>
              💬 View Chat
            </button>
          )}
          <button style={styles.actionBtn} onClick={handlePrint}>
            🖨️ Print
          </button>
          <button style={styles.actionBtnPrimary} onClick={handleSendToFI}>
            📤 Send to F&I
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.worksheetGrid}>
        {/* Vehicle Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>🚗</span> Vehicle
          </h4>
          {vehicle ? (
            <div style={styles.sectionContent}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>{vehicle.trim}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Stock #{vehicle.stockNumber}</div>
              
              <div style={styles.priceRow}>
                <span>MSRP</span>
                <span>{formatCurrency(msrp)}</span>
              </div>
              
              <div style={styles.editableRow}>
                <label style={styles.editableLabel}>Sale Price</label>
                <input
                  type="number"
                  value={overrides.salePrice ?? vehicle.price ?? ''}
                  onChange={(e) => handleOverrideChange('salePrice', e.target.value ? Number(e.target.value) : null)}
                  style={styles.editableInput}
                  placeholder={String(vehicle.price || 0)}
                />
              </div>
            </div>
          ) : vehiclesFromChat.length > 0 ? (
            <div style={styles.sectionContent}>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>Vehicles Discussed:</div>
              {vehiclesFromChat.map((v, idx) => (
                <div key={idx} style={{ marginTop: '8px', padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700 }}>{v.year} {v.model} {v.trim || ''}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Stock #{v.stockNumber}</div>
                  {v.price && <div style={styles.priceRow}><span>Price</span><span>{formatCurrency(v.price)}</span></div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#64748b' }}>No vehicle selected</div>
          )}
        </div>

        {/* Trade-In Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>🔄</span> Trade-In
          </h4>
          {trade?.hasTrade ? (
            <div style={styles.sectionContent}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }}>
                {trade.vehicle?.year} {trade.vehicle?.make} {trade.vehicle?.model}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {trade.vehicle?.mileage?.toLocaleString()} miles
              </div>
              
              <div style={styles.editableRow}>
                <label style={styles.editableLabel}>Trade ACV</label>
                <input
                  type="number"
                  value={overrides.tradeACV ?? trade.estimatedValue ?? ''}
                  onChange={(e) => handleOverrideChange('tradeACV', e.target.value ? Number(e.target.value) : null)}
                  style={styles.editableInput}
                  placeholder="Enter ACV"
                />
              </div>
              
              {trade.hasPayoff && (
                <>
                  <div style={styles.priceRow}>
                    <span>Payoff</span>
                    <span style={styles.negativeValue}>-{formatCurrency(payoff)}</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>Lender</span>
                    <span>{trade.financedWith || 'Unknown'}</span>
                  </div>
                </>
              )}
              
              <div style={styles.equityRow}>
                <span>Net Equity</span>
                <span style={equity >= 0 ? styles.positiveValue : styles.negativeValue}>
                  {equity >= 0 ? '+' : ''}{formatCurrency(equity)}
                </span>
              </div>
            </div>
          ) : tradeFromChat?.hasTrade ? (
            <div style={styles.sectionContent}>
              <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Trade-In Mentioned:</div>
                <div style={{ color: '#78350f', fontSize: '13px' }}>{tradeFromChat.description}</div>
              </div>
              <div style={styles.editableRow}>
                <label style={styles.editableLabel}>Trade ACV (to be appraised)</label>
                <input
                  type="number"
                  value={overrides.tradeACV ?? ''}
                  onChange={(e) => handleOverrideChange('tradeACV', e.target.value ? Number(e.target.value) : null)}
                  style={styles.editableInput}
                  placeholder="Enter ACV after appraisal"
                />
              </div>
            </div>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#64748b' }}>No trade-in</div>
          )}
        </div>

        {/* Down Payment Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>💵</span> Cash Down
          </h4>
          <div style={styles.sectionContent}>
            <div style={styles.editableRow}>
              <label style={styles.editableLabel}>Down Payment</label>
              <input
                type="number"
                value={overrides.downPayment ?? ''}
                onChange={(e) => handleOverrideChange('downPayment', e.target.value ? Number(e.target.value) : null)}
                style={styles.editableInput}
                placeholder="0"
              />
            </div>
            
            <div style={styles.editableRow}>
              <label style={styles.editableLabel}>Admin Fee</label>
              <input
                type="number"
                value={overrides.adminFee}
                onChange={(e) => handleOverrideChange('adminFee', Number(e.target.value) || 0)}
                style={styles.editableInput}
                placeholder="499"
              />
            </div>
            
            {session.budget?.max && (
              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                Budget: {formatCurrency(session.budget.min || 0)} - {formatCurrency(session.budget.max)}/mo
              </div>
            )}
          </div>
        </div>

        {/* Payment Options Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📊</span> Payment
          </h4>
          <div style={styles.sectionContent}>
            {/* Payment Mode Toggle */}
            <div style={styles.paymentToggle}>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(paymentMode === 'finance' ? styles.toggleBtnActive : {}),
                }}
                onClick={() => setPaymentMode('finance')}
              >
                Finance
              </button>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(paymentMode === 'lease' ? styles.toggleBtnActive : {}),
                }}
                onClick={() => setPaymentMode('lease')}
              >
                Lease
              </button>
            </div>

            {paymentMode === 'finance' ? (
              <>
                <div>
                  <label style={styles.editableLabel}>Term</label>
                  <div style={styles.termButtons}>
                    {DEFAULT_FINANCE_TERMS.map(t => (
                      <button
                        key={t}
                        style={{
                          ...styles.termBtn,
                          ...(overrides.financeTerm === t ? styles.termBtnActive : {}),
                        }}
                        onClick={() => handleOverrideChange('financeTerm', t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={styles.editableRow}>
                  <label style={styles.editableLabel}>APR %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={overrides.financeAPR}
                    onChange={(e) => handleOverrideChange('financeAPR', Number(e.target.value))}
                    style={styles.editableInput}
                  />
                </div>
                
                <div style={styles.paymentResult}>
                  <span style={styles.paymentLabel}>Monthly Payment</span>
                  <span style={styles.paymentAmount}>{formatCurrency(finance.monthly)}</span>
                  <span style={styles.paymentTerm}>{overrides.financeTerm} months @ {overrides.financeAPR}% APR</span>
                </div>
                
                <div style={styles.priceRow}>
                  <span>Total Interest</span>
                  <span>{formatCurrency(finance.totalInterest)}</span>
                </div>
                <div style={styles.priceRow}>
                  <span>Total of Payments</span>
                  <span>{formatCurrency(finance.totalCost)}</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={styles.editableLabel}>Term</label>
                  <div style={styles.termButtons}>
                    {DEFAULT_LEASE_TERMS.map(t => (
                      <button
                        key={t}
                        style={{
                          ...styles.termBtn,
                          ...(overrides.leaseTerm === t ? styles.termBtnActive : {}),
                        }}
                        onClick={() => handleOverrideChange('leaseTerm', t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={styles.editableRow}>
                  <label style={styles.editableLabel}>Residual %</label>
                  <input
                    type="number"
                    step="1"
                    value={Math.round(overrides.leaseResidual * 100)}
                    onChange={(e) => handleOverrideChange('leaseResidual', Number(e.target.value) / 100)}
                    style={styles.editableInput}
                  />
                </div>
                
                <div style={styles.paymentResult}>
                  <span style={styles.paymentLabel}>Monthly Payment</span>
                  <span style={styles.paymentAmount}>{formatCurrency(lease.monthly)}</span>
                  <span style={styles.paymentTerm}>{overrides.leaseTerm} months</span>
                </div>
                
                <div style={styles.priceRow}>
                  <span>Due at Signing</span>
                  <span>{formatCurrency(lease.dueAtSigning)}</span>
                </div>
                <div style={styles.priceRow}>
                  <span>Residual Value</span>
                  <span>{formatCurrency(lease.residualValue)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deal Summary Bar */}
      <div style={styles.dealSummary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Sale Price</span>
          <span style={styles.summaryValue}>{formatCurrency(salePrice)}</span>
        </div>
        <div style={styles.summaryDivider}>-</div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Trade Equity</span>
          <span style={styles.summaryValue}>{formatCurrency(Math.max(0, equity))}</span>
        </div>
        <div style={styles.summaryDivider}>-</div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Down Payment</span>
          <span style={styles.summaryValue}>{formatCurrency(downPayment)}</span>
        </div>
        <div style={styles.summaryDivider}>+</div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Admin Fee</span>
          <span style={styles.summaryValue}>{formatCurrency(overrides.adminFee)}</span>
        </div>
        <div style={styles.summaryDivider}>=</div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Amount Financed</span>
          <span style={styles.summaryValueLarge}>{formatCurrency(financePrincipal)}</span>
        </div>
      </div>

      {/* Manager Notes */}
      <div style={styles.notesBox}>
        <h4 style={styles.boxTitle}>Manager Notes</h4>
        <textarea
          value={managerNotes}
          onChange={(e) => { setManagerNotes(e.target.value); setNotesSaved(false); }}
          placeholder="Add notes about this deal..."
          style={styles.notesTextarea as React.CSSProperties}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <button 
            style={{
              ...styles.actionBtnPrimary,
              opacity: savingNotes || !managerNotes.trim() ? 0.6 : 1,
              cursor: savingNotes || !managerNotes.trim() ? 'not-allowed' : 'pointer'
            }} 
            onClick={handleSaveNotes}
            disabled={savingNotes || !managerNotes.trim()}
          >
            {savingNotes ? '💾 Saving...' : '💾 Save Notes'}
          </button>
          {notesSaved && (
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
              ✓ Notes saved!
            </span>
          )}
        </div>
      </div>

      {/* Payment Info from Chat */}
      {paymentFromChat && (paymentFromChat.downPayment || paymentFromChat.monthlyBudget || paymentFromChat.payingCash) && (
        <div style={{ ...styles.notesBox, marginTop: '20px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h4 style={{ ...styles.boxTitle, color: '#1e40af' }}>💬 Payment Info from Conversation</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#1a1a2e' }}>
            {paymentFromChat.payingCash && (
              <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Customer indicated paying CASH</span>
            )}
            {paymentFromChat.downPayment && (
              <span>Down Payment mentioned: {formatCurrency(paymentFromChat.downPayment)}</span>
            )}
            {paymentFromChat.monthlyBudget && (
              <span>Monthly Budget: {formatCurrency(paymentFromChat.monthlyBudget)}/mo</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
