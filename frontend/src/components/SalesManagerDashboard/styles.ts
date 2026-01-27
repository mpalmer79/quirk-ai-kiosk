/**
 * Sales Manager Dashboard - Styles
 */

import { CSSProperties } from 'react';

export const styles: Record<string, CSSProperties> = {
  // Layout
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    color: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Montserrat", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    padding: '24px 32px',
  },
  
  // Tabs
  tabContainer: {
    display: 'flex',
    gap: '4px',
    marginRight: '16px',
  },
  tabButton: {
    padding: '8px 16px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabButtonLeft: {
    borderRadius: '6px 0 0 6px',
  },
  tabButtonRight: {
    borderRadius: '0 6px 6px 0',
  },
  tabButtonActive: {
    background: '#10b981',
    color: '#ffffff',
  },
  tabButtonInactive: {
    background: '#f1f5f9',
    color: '#1a1a2e',
  },
  
  // Controls
  lastUpdate: {
    fontSize: '13px',
    color: '#1a1a2e',
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#1a1a2e',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#10b981',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '8px 16px',
    background: '#3b4c6b',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  
  // Session List
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sessionListTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a1a2e',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  
  // Cards
  card: {
    padding: '16px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardActive: {
    background: '#f0fdf4',
    border: '2px solid #10b981',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTime: {
    fontSize: '12px',
    color: '#64748b',
  },
  cardStep: {
    fontSize: '12px',
    color: '#64748b',
  },
  cardVehicle: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: 600,
  },
  
  // Badges
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeSmall: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
  },
  
  // States
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
    color: '#64748b',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    gap: '12px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  placeholderTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  placeholderText: {
    fontSize: '14px',
    margin: 0,
  },
  
  // Detail Panel
  detailPanel: {
    minHeight: '600px',
  },
  
  // Worksheet
  worksheet: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  worksheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
  },
  worksheetTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  worksheetCustomer: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  worksheetActions: {
    display: 'flex',
    gap: '8px',
  },
  worksheetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  
  // Sections
  section: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a1a2e',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 16px 0',
  },
  sectionIcon: {
    fontSize: '16px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  
  // Form Elements
  editableRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  editableLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  editableInput: {
    padding: '10px 12px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box',
  },
  
  // Price Rows
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#1a1a2e',
  },
  equityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 600,
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0',
    marginTop: '8px',
  },
  positiveValue: {
    color: '#10b981',
  },
  negativeValue: {
    color: '#ef4444',
  },
  
  // Buttons
  actionBtn: {
    padding: '8px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#1a1a2e',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionBtnPrimary: {
    padding: '8px 14px',
    background: '#10b981',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionBtnBlue: {
    padding: '8px 14px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  viewChatBtn: {
    padding: '8px 14px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    color: '#3b82f6',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  
  // Payment
  paymentToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  toggleBtn: {
    flex: 1,
    padding: '10px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleBtnActive: {
    background: '#f0fdf4',
    border: '1px solid #10b981',
    color: '#10b981',
  },
  termButtons: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
  },
  termBtn: {
    flex: 1,
    padding: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#1a1a2e',
    fontSize: '13px',
    cursor: 'pointer',
  },
  termBtnActive: {
    background: '#f0fdf4',
    border: '1px solid #10b981',
    color: '#10b981',
  },
  paymentResult: {
    textAlign: 'center',
    padding: '16px',
    background: '#f0fdf4',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '1px solid #bbf7d0',
  },
  paymentLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  paymentAmount: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 700,
    color: '#10b981',
    margin: '4px 0',
  },
  paymentTerm: {
    display: 'block',
    fontSize: '13px',
    color: '#64748b',
  },
  
  // Deal Summary
  dealSummary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px',
    background: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  summaryValueLarge: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#10b981',
  },
  summaryDivider: {
    fontSize: '20px',
    color: '#cbd5e1',
    fontWeight: 300,
  },
  
  // Notes
  notesBox: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px',
  },
  boxTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a1a2e',
    textTransform: 'uppercase',
    margin: '0 0 12px 0',
  },
  notesTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1a1a2e',
    fontSize: '13px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  
  // Chat
  chatPanel: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  chatTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },
  chatMessages: {
    padding: '20px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '12px',
    maxWidth: '80%',
  },
  messageUser: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    marginLeft: 'auto',
  },
  messageAssistant: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    marginRight: 'auto',
  },
  messageRole: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '4px',
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: 1.5,
    margin: 0,
    color: '#1a1a2e',
  },
};
