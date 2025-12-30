/**
 * QUIRK AI Kiosk - Sales Manager Dashboard
 * 
 * Features:
 * - Real-time customer session monitoring
 * - Digital Worksheet with payment scenarios
 * - Editable deal structure (price, trade, payments)
 * - Finance vs Lease comparison
 * - Equity calculator
 * - Chat transcript viewer
 * - Quick actions (Print, Send to F&I)
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, CSSProperties } from 'react';
import api from './api';

// ============================================================================
// Types
// ============================================================================

interface CustomerSession {
  sessionId: string;
  customerName: string | null;
  phone: string | null;
  startTime: string;
  lastActivity: string;
  currentStep: string;
  vehicleInterest: {
    model: string | null;
    cab: string | null;
    colors: string[];
  };
  budget: {
    min: number | null;
    max: number | null;
    downPaymentPercent: number | null;
  };
  tradeIn: {
    hasTrade: boolean | null;
    vehicle: {
      year: string | null;
      make: string | null;
      model: string | null;
      mileage: number | null;
    } | null;
    hasPayoff: boolean | null;
    payoffAmount: number | null;
    monthlyPayment: number | null;
    financedWith: string | null;
    estimatedValue?: number | null;
  };
  selectedVehicle: {
    stockNumber: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    price: number | null;
    msrp?: number | null;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface SessionDetail {
  sessionId: string;
  customerName?: string;
  phone?: string;
  path?: string;
  currentStep?: string;
  createdAt: string;
  updatedAt: string;
  vehicleInterest?: CustomerSession['vehicleInterest'];
  budget?: CustomerSession['budget'];
  tradeIn?: Partial<{
    hasTrade: boolean;
    vehicle: {
      year: string;
      make: string;
      model: string;
      mileage: number;
    } | null;
    hasPayoff: boolean;
    payoffAmount: number;
    monthlyPayment: number;
    financedWith: string;
    estimatedValue?: number;
  }>;
  vehicle?: Partial<{
    stockNumber: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    price: number;
    msrp?: number;
  }>;
  chatHistory?: ChatMessage[];
  actions?: string[];
}

interface DealOverrides {
  salePrice: number | null;
  tradeACV: number | null;
  downPayment: number | null;
  adminFee: number;
  financeTerm: number;
  financeAPR: number;
  leaseTerm: number;
  leaseMoneyFactor: number;
  leaseResidual: number;
}

// ============================================================================
// Constants
// ============================================================================

const STEP_LABELS: Record<string, string> = {
  welcome: 'Welcome Screen',
  category: 'Selecting Category',
  model: 'Selecting Model',
  cab: 'Selecting Cab',
  colors: 'Choosing Colors',
  budget: 'Setting Budget',
  tradeIn: 'Trade-In Info',
  'trade-in': 'Trade-In Info',
  inventory: 'Browsing Inventory',
  vehicleDetail: 'Viewing Vehicle',
  handoff: 'Ready for Handoff',
  aiChat: 'AI Assistant Chat',
  aiAssistant: 'AI Assistant Chat',
  modelBudget: 'Model & Budget Flow',
  stockLookup: 'Stock Lookup',
  guidedQuiz: 'Guided Quiz',
  browse: 'Browsing',
  browsing: 'Browsing',
  name_entered: 'Just Started',
};

const DEFAULT_FINANCE_TERMS = [36, 48, 60, 72, 84];
const DEFAULT_LEASE_TERMS = [24, 36, 39, 48];

// ============================================================================
// Payment Calculation Functions
// ============================================================================

const calculateFinancePayment = (
  principal: number,
  apr: number,
  term: number
): { monthly: number; totalCost: number; totalInterest: number } => {
  if (principal <= 0) return { monthly: 0, totalCost: 0, totalInterest: 0 };
  
  const monthlyRate = apr / 100 / 12;
  
  if (monthlyRate === 0) {
    const monthly = Math.round(principal / term);
    return { monthly, totalCost: principal, totalInterest: 0 };
  }
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
    (Math.pow(1 + monthlyRate, term) - 1);
  
  const totalCost = payment * term;
  const totalInterest = totalCost - principal;
  
  return {
    monthly: Math.round(payment),
    totalCost: Math.round(totalCost),
    totalInterest: Math.round(totalInterest),
  };
};

const calculateLeasePayment = (
  msrp: number,
  salePrice: number,
  downPayment: number,
  term: number,
  residualPercent: number,
  moneyFactor: number
): { monthly: number; dueAtSigning: number; residualValue: number } => {
  if (msrp <= 0) return { monthly: 0, dueAtSigning: 0, residualValue: 0 };
  
  const capitalizedCost = salePrice - downPayment;
  const residualValue = msrp * residualPercent;
  const ACQUISITION_FEE = 895;
  
  const depreciation = (capitalizedCost - residualValue) / term;
  const rentCharge = (capitalizedCost + residualValue) * moneyFactor;
  const monthly = Math.round(depreciation + rentCharge);
  
  const dueAtSigning = downPayment + monthly + ACQUISITION_FEE;
  
  return { monthly, dueAtSigning: Math.round(dueAtSigning), residualValue: Math.round(residualValue) };
};

// ============================================================================
// Component
// ============================================================================

interface SalesManagerDashboardProps {
  customerData?: { selectedSessionId?: string };
  updateCustomerData?: (data: { selectedSessionId?: string }) => void;
  navigateTo?: (page: string) => void;
}

const SalesManagerDashboard: React.FC<SalesManagerDashboardProps> = ({ customerData, updateCustomerData, navigateTo }) => {
  // Session state
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CustomerSession | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [showChatTranscript, setShowChatTranscript] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [initialSessionChecked, setInitialSessionChecked] = useState(false);
  
  // Digital Worksheet state
  const [paymentMode, setPaymentMode] = useState<'finance' | 'lease'>('finance');
  const [managerNotes, setManagerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [overrides, setOverrides] = useState<DealOverrides>({
    salePrice: null,
    tradeACV: null,
    downPayment: null,
    adminFee: 499,
    financeTerm: 60,
    financeAPR: 6.9,
    leaseTerm: 36,
    leaseMoneyFactor: 0.00125,
    leaseResidual: 0.55,
  });

  // ============================================================================
  // Chat History Analysis Helpers
  // ============================================================================

  /**
   * Extract vehicle mentions from chat history
   * Returns array of vehicles discussed in the conversation
   */
  const extractVehiclesFromChat = (chatHistory: ChatMessage[] | undefined): Array<{stockNumber: string, year: string, model: string, trim?: string, price?: number}> => {
    if (!chatHistory || chatHistory.length === 0) return [];
    
    const vehicles: Array<{stockNumber: string, year: string, model: string, trim?: string, price?: number}> = [];
    
    // Pattern to match: **2025 Corvette 3LZ (Stock #M39196)** - $130,575
    // Or: 2025 Corvette 3LZ (Stock #M39196) - $130,575
    const vehiclePattern = /\*?\*?(\d{4})\s+([A-Za-z]+(?:\s+[A-Za-z0-9]+)?)\s+([A-Za-z0-9]+)?\s*\(Stock\s*#?([A-Za-z0-9]+)\)\*?\*?\s*[-–]?\s*\$?([\d,]+)?/gi;
    
    chatHistory.forEach(msg => {
      if (msg.role === 'assistant') {
        // Reset regex lastIndex for each message
        vehiclePattern.lastIndex = 0;
        let match;
        while ((match = vehiclePattern.exec(msg.content)) !== null) {
          const [, year, model, trim, stock, price] = match;
          // Avoid duplicates
          if (!vehicles.find(v => v.stockNumber === stock)) {
            vehicles.push({
              stockNumber: stock,
              year: year,
              model: model.trim(),
              trim: trim?.trim(),
              price: price ? parseInt(price.replace(/,/g, '')) : undefined
            });
          }
        }
      }
    });
    
    return vehicles;
  };

  /**
   * Extract trade-in information from chat history
   */
  const extractTradeInFromChat = (chatHistory: ChatMessage[] | undefined): {hasTrade: boolean, description: string} | null => {
    if (!chatHistory || chatHistory.length === 0) return null;
    
    const tradeKeywords = ['trade', 'trading', 'trade-in', 'current vehicle', 'my car', 'i have a', 'want to trade'];
    
    for (const msg of chatHistory) {
      if (msg.role === 'user') {
        const lowerContent = msg.content.toLowerCase();
        if (tradeKeywords.some(keyword => lowerContent.includes(keyword))) {
          // Extract vehicle description from the message
          return {
            hasTrade: true,
            description: msg.content
          };
        }
      }
    }
    
    return null;
  };

  /**
   * Extract payment preferences from chat history
   */
  const extractPaymentFromChat = (chatHistory: ChatMessage[] | undefined): {downPayment?: number, monthlyBudget?: number, payingCash?: boolean} | null => {
    if (!chatHistory || chatHistory.length === 0) return null;
    
    const result: {downPayment?: number, monthlyBudget?: number, payingCash?: boolean} = {};
    
    chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        const lowerContent = msg.content.toLowerCase();
        
        // Check for cash payment
        if (lowerContent.includes('cash') || lowerContent.includes('paying cash') || lowerContent.includes('pay cash')) {
          result.payingCash = true;
        }
        
        // Extract down payment amounts
        const downMatch = msg.content.match(/(\$?[\d,]+)\s*(down|down payment)/i);
        if (downMatch) {
          result.downPayment = parseInt(downMatch[1].replace(/[$,]/g, ''));
        }
        
        // Extract monthly budget
        const monthlyMatch = msg.content.match(/(\$?[\d,]+)\s*(per month|\/month|monthly|a month)/i);
        if (monthlyMatch) {
          result.monthlyBudget = parseInt(monthlyMatch[1].replace(/[$,]/g, ''));
        }
      }
    });
    
    return Object.keys(result).length > 0 ? result : null;
  };

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchSessions = async (isInitialLoad: boolean = false) => {
    try {
      const data = await api.getActiveSessions(60);
      setSessions(data.sessions || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      // Only set loading to false on initial load
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getTrafficSession(sessionId);
      setSessionDetail(data as unknown as SessionDetail);
    } catch (err) {
      console.error('Error fetching session detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchSessions(true); // Initial load shows loading state
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) interval = setInterval(() => fetchSessions(false), 5000); // Refreshes don't show loading
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Auto-select session if navigated from Traffic Log with selectedSessionId
  useEffect(() => {
    if (!initialSessionChecked && sessions.length > 0 && customerData?.selectedSessionId) {
      const targetSession = sessions.find(s => s.sessionId === customerData.selectedSessionId);
      if (targetSession) {
        // Inline session selection logic
        setSelectedSession(targetSession);
        setShowChatTranscript(false);
        setManagerNotes('');
        setOverrides({
          salePrice: null,
          tradeACV: null,
          downPayment: null,
          adminFee: 499,
          financeTerm: 60,
          financeAPR: 6.9,
          leaseTerm: 36,
          leaseMoneyFactor: 0.00125,
          leaseResidual: 0.55,
        });
        fetchSessionDetail(targetSession.sessionId);
        // Clear the selectedSessionId from customerData after selecting
        updateCustomerData?.({ selectedSessionId: undefined });
      }
      setInitialSessionChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, customerData?.selectedSessionId, initialSessionChecked]);

  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find(s => s.sessionId === selectedSession.sessionId);
      if (updated) setSelectedSession(updated);
      // Don't refetch session detail on every 5-second refresh - only update the session card data
      // Session detail is fetched when user clicks on a session
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSessionSelect = (session: CustomerSession) => {
    setSelectedSession(session);
    setShowChatTranscript(false);
    setManagerNotes('');
    setNotesSaved(false);
    setOverrides({
      salePrice: null,
      tradeACV: null,
      downPayment: null,
      adminFee: 499,
      financeTerm: 60,
      financeAPR: 6.9,
      leaseTerm: 36,
      leaseMoneyFactor: 0.00125,
      leaseResidual: 0.55,
    });
    fetchSessionDetail(session.sessionId);
  };

  const handleHomeClick = () => {
    setSelectedSession(null);
    setSessionDetail(null);
    setShowChatTranscript(false);
    setManagerNotes('');
  };

  const handleOverrideChange = (field: keyof DealOverrides, value: number | null) => {
    setOverrides(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendToFI = () => {
    alert('Send to F&I functionality would integrate with your DMS (PBS/Reynolds/CDK)');
  };

  const handleSaveNotes = async () => {
    if (!selectedSession || !managerNotes.trim()) return;
    
    setSavingNotes(true);
    setNotesSaved(false);
    
    try {
      // Save notes via API
      await api.logTrafficSession({
        sessionId: selectedSession.sessionId,
        managerNotes: managerNotes,
        currentStep: selectedSession.currentStep,
      });
      setNotesSaved(true);
      // Reset saved indicator after 3 seconds
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const getStepLabel = (step: string) => STEP_LABELS[step] || step || 'Browsing';

  const getTimeSince = (dateStr: string): string => {
    if (!dateStr) return 'Unknown';
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const formatCurrency = (val: number | null | undefined): string => {
    if (val == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getEffectiveValues = () => {
    const vehicle = selectedSession?.selectedVehicle;
    const trade = selectedSession?.tradeIn;
    
    const salePrice = overrides.salePrice ?? vehicle?.price ?? 0;
    const msrp = vehicle?.msrp ?? salePrice * 1.05;
    const tradeACV = overrides.tradeACV ?? trade?.estimatedValue ?? 0;
    const payoff = trade?.payoffAmount ?? 0;
    const equity = tradeACV - payoff;
    const downPayment = overrides.downPayment ?? 0;
    
    return { salePrice, msrp, tradeACV, payoff, equity, downPayment };
  };

  const calculateDealNumbers = () => {
    const { salePrice, msrp, equity, downPayment } = getEffectiveValues();
    
    const financePrincipal = salePrice - Math.max(0, equity) - downPayment + overrides.adminFee;
    const finance = calculateFinancePayment(
      financePrincipal,
      overrides.financeAPR,
      overrides.financeTerm
    );
    
    const lease = calculateLeasePayment(
      msrp,
      salePrice,
      downPayment + Math.max(0, equity),
      overrides.leaseTerm,
      overrides.leaseResidual,
      overrides.leaseMoneyFactor
    );
    
    return { finance, lease };
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderSessionList = () => (
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
          <div
            key={session.sessionId}
            style={{
              ...styles.sessionCard,
              ...(selectedSession?.sessionId === session.sessionId ? styles.sessionCardActive : {}),
            }}
            onClick={() => handleSessionSelect(session)}
          >
            <div style={styles.sessionHeader}>
              <span style={styles.customerName}>
                {session.customerName || 'Guest Customer'}
              </span>
              <span style={styles.sessionTime}>{getTimeSince(session.lastActivity)}</span>
            </div>
            <div style={styles.sessionMeta}>
              <span style={styles.sessionStep}>{getStepLabel(session.currentStep)}</span>
              {session.selectedVehicle?.model && (
                <span style={styles.sessionVehicle}>
                  🚗 {session.selectedVehicle.year} {session.selectedVehicle.model}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderChatTranscript = () => {
    const messages = sessionDetail?.chatHistory || [];
    
    return (
      <div style={styles.chatPanel}>
        <div style={styles.chatHeader}>
          <button style={styles.backBtn} onClick={() => setShowChatTranscript(false)}>
            ← Back to Worksheet
          </button>
          <h3 style={styles.chatTitle}>Chat Transcript</h3>
        </div>
        <div style={styles.chatMessages}>
          {messages.length === 0 ? (
            <div style={styles.noMessages}>No chat history available</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.messageUser : styles.messageAssistant),
                }}
              >
                <span style={styles.messageRole}>
                  {msg.role === 'user' ? 'Customer' : 'Quirk AI'}
                </span>
                <p style={styles.messageContent}>{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderDigitalWorksheet = () => {
    if (!selectedSession) return null;
    
    const { salePrice, msrp, payoff, equity, downPayment } = getEffectiveValues();
    const { finance, lease } = calculateDealNumbers();
    const vehicle = selectedSession.selectedVehicle;
    const trade = selectedSession.tradeIn;
    
    return (
      <div style={styles.worksheet}>
        {/* Worksheet Header */}
        <div style={styles.worksheetHeader}>
          <div>
            <h3 style={styles.worksheetTitle}>Digital Worksheet</h3>
            <p style={styles.worksheetCustomer}>
              {selectedSession.customerName || 'Guest Customer'}
              {selectedSession.phone && ` • ${selectedSession.phone}`}
            </p>
          </div>
          <div style={styles.worksheetActions}>
            {sessionDetail?.chatHistory && sessionDetail.chatHistory.length > 0 && (
              <button style={styles.viewChatBtn} onClick={() => setShowChatTranscript(true)}>
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
          <div style={styles.worksheetSection}>
            <h4 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🚗</span> Vehicle
            </h4>
            {vehicle ? (
              <div style={styles.sectionContent}>
                <div style={styles.vehicleTitle}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                <div style={styles.vehicleTrim}>{vehicle.trim}</div>
                <div style={styles.vehicleStock}>Stock #{vehicle.stockNumber}</div>
                
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
            ) : (() => {
              // Check chat history for vehicles discussed
              const vehiclesFromChat = extractVehiclesFromChat(sessionDetail?.chatHistory);
              if (vehiclesFromChat.length > 0) {
                return (
                  <div style={styles.sectionContent}>
                    <div style={{...styles.pendingValue, fontStyle: 'normal', color: '#1a1a2e'}}>
                      <strong>Vehicles Discussed:</strong>
                    </div>
                    {vehiclesFromChat.map((v, idx) => (
                      <div key={idx} style={{marginTop: '8px', padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0'}}>
                        <div style={styles.vehicleTitle}>{v.year} {v.model} {v.trim || ''}</div>
                        <div style={styles.vehicleStock}>Stock #{v.stockNumber}</div>
                        {v.price && <div style={styles.priceRow}><span>Price</span><span>{formatCurrency(v.price)}</span></div>}
                      </div>
                    ))}
                  </div>
                );
              }
              return <div style={styles.pendingValue}>No vehicle selected</div>;
            })()}
          </div>

          {/* Trade-In Section */}
          <div style={styles.worksheetSection}>
            <h4 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🔄</span> Trade-In
            </h4>
            {trade?.hasTrade ? (
              <div style={styles.sectionContent}>
                <div style={styles.tradeVehicle}>
                  {trade.vehicle?.year} {trade.vehicle?.make} {trade.vehicle?.model}
                </div>
                <div style={styles.tradeMileage}>
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
                    {trade.monthlyPayment && (
                      <div style={styles.priceRow}>
                        <span>Monthly Payment</span>
                        <span>{formatCurrency(trade.monthlyPayment)}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div style={styles.equityRow}>
                  <span>Net Equity</span>
                  <span style={equity >= 0 ? styles.positiveValue : styles.negativeValue}>
                    {equity >= 0 ? '+' : ''}{formatCurrency(equity)}
                  </span>
                </div>
              </div>
            ) : (() => {
              // Check chat history for trade-in mentions
              const tradeFromChat = extractTradeInFromChat(sessionDetail?.chatHistory);
              if (tradeFromChat?.hasTrade) {
                return (
                  <div style={styles.sectionContent}>
                    <div style={{padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d'}}>
                      <div style={{fontWeight: 600, color: '#92400e', marginBottom: '4px'}}>Trade-In Mentioned:</div>
                      <div style={{color: '#78350f', fontSize: '13px'}}>{tradeFromChat.description}</div>
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
                );
              }
              return <div style={styles.pendingValue}>No trade-in</div>;
            })()}
          </div>

          {/* Down Payment Section */}
          <div style={styles.worksheetSection}>
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
              
              {selectedSession.budget?.downPaymentPercent && (
                <div style={styles.budgetNote}>
                  Customer indicated {selectedSession.budget.downPaymentPercent}% down
                </div>
              )}
              
              {selectedSession.budget?.max && (
                <div style={styles.budgetNote}>
                  Budget: {formatCurrency(selectedSession.budget.min || 0)} - {formatCurrency(selectedSession.budget.max)}/mo
                </div>
              )}
            </div>
          </div>

          {/* Payment Options Section */}
          <div style={styles.worksheetSection}>
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
                  <div style={styles.termSelector}>
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
                    <span style={styles.paymentTerm}>{overrides.financeTerm} months @ {overrides.financeAPR}%</span>
                  </div>
                  
                  <div style={styles.priceRow}>
                    <span>Total Interest</span>
                    <span>{formatCurrency(finance.totalInterest)}</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>Total Cost</span>
                    <span>{formatCurrency(finance.totalCost + downPayment)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.termSelector}>
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
            <span style={styles.summaryValueLarge}>
              {formatCurrency(salePrice - Math.max(0, equity) - downPayment + overrides.adminFee)}
            </span>
          </div>
        </div>

        {/* Vehicle Interest & Notes */}
        <div style={styles.bottomRow}>
          {selectedSession.vehicleInterest?.model && (
            <div style={styles.interestBox}>
              <h4 style={styles.boxTitle}>Vehicle Interest</h4>
              <div style={styles.interestDetails}>
                <span>Model: {selectedSession.vehicleInterest.model}</span>
                {selectedSession.vehicleInterest.cab && (
                  <span>Cab: {selectedSession.vehicleInterest.cab}</span>
                )}
                {selectedSession.vehicleInterest.colors?.length > 0 && (
                  <span>Colors: {selectedSession.vehicleInterest.colors.join(', ')}</span>
                )}
              </div>
            </div>
          )}
          
          <div style={styles.notesBox}>
            <h4 style={styles.boxTitle}>Manager Notes</h4>
            <textarea
              value={managerNotes}
              onChange={(e) => { setManagerNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Add notes about this deal..."
              style={styles.notesTextarea}
            />
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px'}}>
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
                <span style={{color: '#10b981', fontSize: '13px', fontWeight: 600}}>
                  ✓ Notes saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Preferences from Chat */}
        {(() => {
          const paymentFromChat = extractPaymentFromChat(sessionDetail?.chatHistory);
          if (paymentFromChat && (paymentFromChat.downPayment || paymentFromChat.monthlyBudget || paymentFromChat.payingCash)) {
            return (
              <div style={{...styles.interestBox, marginTop: '20px', background: '#eff6ff', border: '1px solid #bfdbfe'}}>
                <h4 style={{...styles.boxTitle, color: '#1e40af'}}>💬 Payment Info from Conversation</h4>
                <div style={styles.interestDetails}>
                  {paymentFromChat.payingCash && (
                    <span style={{color: '#10b981', fontWeight: 600}}>✓ Customer indicated paying CASH</span>
                  )}
                  {paymentFromChat.downPayment && (
                    <span>Down Payment mentioned: {formatCurrency(paymentFromChat.downPayment)}</span>
                  )}
                  {paymentFromChat.monthlyBudget && (
                    <span>Monthly Budget: {formatCurrency(paymentFromChat.monthlyBudget)}/mo</span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Sales Manager Dashboard</h1>
        <div style={styles.headerControls}>
          <span style={styles.lastUpdate}>Last update: {lastUpdate}</span>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={styles.checkbox}
            />
            Auto-refresh
          </label>
          <button style={styles.refreshBtn} onClick={() => fetchSessions(false)}>
            Refresh
          </button>
          {selectedSession && (
            <button style={styles.homeBtn} onClick={() => navigateTo ? navigateTo('trafficLog') : handleHomeClick()}>
              ← All Sessions
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {renderSessionList()}
        
        <div style={styles.detailPanel}>
          {!selectedSession ? (
            <div style={styles.placeholder}>
              <span style={styles.placeholderIcon}>👈</span>
              <h3 style={styles.placeholderTitle}>Select a Session</h3>
              <p style={styles.placeholderText}>
                Choose a customer session from the list to view their Digital Worksheet
              </p>
            </div>
          ) : loadingDetail ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <span>Loading session details...</span>
            </div>
          ) : showChatTranscript ? (
            renderChatTranscript()
          ) : (
            renderDigitalWorksheet()
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
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
  homeBtn: {
    padding: '8px 16px',
    background: '#3b4c6b',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    padding: '24px 32px',
  },
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
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
    color: '#1a1a2e',
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
    color: '#1a1a2e',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  sessionCard: {
    padding: '16px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sessionCardActive: {
    background: '#f0fdf4',
    border: '2px solid #10b981',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  customerName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  sessionTime: {
    fontSize: '12px',
    color: '#1a1a2e',
  },
  sessionMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sessionStep: {
    fontSize: '12px',
    color: '#1a1a2e',
  },
  sessionVehicle: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: 600,
  },
  detailPanel: {
    minHeight: '600px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#1a1a2e',
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
  backBtn: {
    padding: '8px 12px',
    background: '#3b4c6b',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
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
  noMessages: {
    textAlign: 'center',
    color: '#1a1a2e',
    padding: '40px',
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
    color: '#1a1a2e',
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
    color: '#1a1a2e',
    margin: '4px 0 0 0',
  },
  worksheetActions: {
    display: 'flex',
    gap: '8px',
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
  worksheetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  worksheetSection: {
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
  vehicleTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  vehicleTrim: {
    fontSize: '14px',
    color: '#1a1a2e',
  },
  vehicleStock: {
    fontSize: '13px',
    color: '#1a1a2e',
  },
  tradeVehicle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  tradeMileage: {
    fontSize: '13px',
    color: '#1a1a2e',
  },
  pendingValue: {
    fontSize: '14px',
    color: '#1a1a2e',
    fontStyle: 'italic',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#1a1a2e',
  },
  editableRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  editableLabel: {
    fontSize: '12px',
    color: '#1a1a2e',
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
  budgetNote: {
    fontSize: '12px',
    color: '#1a1a2e',
    fontStyle: 'italic',
  },
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
  termSelector: {
    marginBottom: '12px',
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
    color: '#1a1a2e',
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
    color: '#1a1a2e',
  },
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
    color: '#1a1a2e',
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
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  interestBox: {
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
  interestDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#1a1a2e',
  },
  notesBox: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px',
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
};

export default SalesManagerDashboard;
