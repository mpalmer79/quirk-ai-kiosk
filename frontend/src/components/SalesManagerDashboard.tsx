import React, { useState, useEffect, CSSProperties } from 'react';
import api from './api';

// Types
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
  };
  selectedVehicle: {
    stockNumber: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    price: number | null;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  }>;
  chatHistory?: ChatMessage[];
  actions?: string[];
}

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

const SalesManagerDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CustomerSession | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [showChatTranscript, setShowChatTranscript] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await api.getActiveSessions(60);
      setSessions(data.sessions || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    setLoadingDetail(true);
    try {
      setSessionDetail(await api.getTrafficSession(sessionId));
    } catch (err) {
      console.error('Error fetching session detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) interval = setInterval(fetchSessions, 5000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find(s => s.sessionId === selectedSession.sessionId);
      if (updated) setSelectedSession(updated);
      fetchSessionDetail(selectedSession.sessionId);
    }
  }, [sessions, selectedSession?.sessionId]);

  const handleSessionSelect = (session: CustomerSession) => {
    setSelectedSession(session);
    setShowChatTranscript(false);
    fetchSessionDetail(session.sessionId);
  };

  const handleHomeClick = () => {
    setSelectedSession(null);
    setSessionDetail(null);
    setShowChatTranscript(false);
  };

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
    if (val == null) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

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
          <button style={styles.refreshBtn} onClick={fetchSessions}>
            Refresh Now
          </button>
          <button style={styles.homeBtn} onClick={handleHomeClick}>
            HOME
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Session List */}
        <div style={styles.sessionList}>
          <h2 style={styles.sessionListTitle}>
            ACTIVE KIOSK SESSIONS ({sessions.length})
          </h2>

          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <span>Loading active sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div style={styles.emptyState}>
              <span>No active sessions at this time</span>
            </div>
          ) : (
            <div style={styles.sessionCards}>
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  style={{
                    ...styles.sessionCard,
                    ...(selectedSession?.sessionId === session.sessionId
                      ? styles.sessionCardActive
                      : {}),
                  }}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div style={styles.sessionHeader}>
                    <span style={styles.customerName}>
                      {session.customerName || 'Anonymous'}
                    </span>
                    <span style={styles.sessionTime}>
                      {getTimeSince(session.lastActivity)}
                    </span>
                  </div>
                  <div style={styles.sessionStep}>
                    {getStepLabel(session.currentStep)}
                  </div>
                  {session.phone && (
                    <div style={styles.sessionPhone}>{session.phone}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div style={styles.detailPanel}>
          {!selectedSession ? (
            <div style={styles.noSelection}>
              <span>Select a session to view details</span>
            </div>
          ) : showChatTranscript && sessionDetail?.chatHistory ? (
            <div style={styles.chatTranscript}>
              <div style={styles.transcriptHeader}>
                <h3>Customer Chat with Quirk AI</h3>
                <button
                  style={styles.backBtn}
                  onClick={() => setShowChatTranscript(false)}
                >
                  Back to Worksheet
                </button>
              </div>
              <div style={styles.chatMessages}>
                {sessionDetail.chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.chatMessage,
                      ...(msg.role === 'user'
                        ? styles.userMessage
                        : styles.assistantMessage),
                    }}
                  >
                    <span style={styles.messageRole}>
                      {msg.role === 'user' ? 'Customer' : 'Quirk AI'}
                    </span>
                    <p style={styles.messageContent}>{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.worksheet}>
              <div style={styles.worksheetHeader}>
                <h3 style={styles.worksheetTitle}>
                  Digital Quote Worksheet - {selectedSession.customerName || 'Customer'}
                </h3>
                {sessionDetail?.chatHistory && sessionDetail.chatHistory.length > 0 && (
                  <button
                    style={styles.viewChatBtn}
                    onClick={() => setShowChatTranscript(true)}
                  >
                    View Chat Transcript
                  </button>
                )}
              </div>

              {/* 4-Square Grid */}
              <div style={styles.fourSquareGrid}>
                {/* Trade-In */}
                <div style={styles.quadrant}>
                  <h4 style={styles.quadrantTitle}>TRADE-IN</h4>
                  <div style={styles.quadrantContent}>
                    {selectedSession.tradeIn?.hasTrade ? (
                      <>
                        <div style={styles.tradeVehicleInfo}>
                          <span style={styles.tradeModel}>
                            {selectedSession.tradeIn.vehicle?.year}{' '}
                            {selectedSession.tradeIn.vehicle?.make}{' '}
                            {selectedSession.tradeIn.vehicle?.model}
                          </span>
                          <span style={styles.tradeMileage}>
                            {selectedSession.tradeIn.vehicle?.mileage?.toLocaleString()} miles
                          </span>
                        </div>
                        {selectedSession.tradeIn.hasPayoff ? (
                          <div style={styles.payoffInfo}>
                            <div style={styles.payoffRow}>
                              <span>Payoff:</span>
                              <span>{formatCurrency(selectedSession.tradeIn.payoffAmount)}</span>
                            </div>
                            <div style={styles.payoffRow}>
                              <span>Monthly:</span>
                              <span>{formatCurrency(selectedSession.tradeIn.monthlyPayment)}</span>
                            </div>
                            <div style={styles.payoffRow}>
                              <span>Lender:</span>
                              <span>{selectedSession.tradeIn.financedWith || 'Not specified'}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={styles.paidOff}>✓ Paid Off</span>
                        )}
                      </>
                    ) : (
                      <span style={styles.noTrade}>No trade-in</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={styles.quadrant}>
                  <h4 style={styles.quadrantTitle}>PRICE</h4>
                  <div style={styles.quadrantContent}>
                    {selectedSession.selectedVehicle ? (
                      <>
                        <span style={styles.bigPrice}>
                          {formatCurrency(selectedSession.selectedVehicle.price)}
                        </span>
                        <span style={styles.subValue}>
                          {selectedSession.selectedVehicle.year}{' '}
                          {selectedSession.selectedVehicle.make}{' '}
                          {selectedSession.selectedVehicle.model}
                        </span>
                        <span style={styles.subValue}>
                          Stock #{selectedSession.selectedVehicle.stockNumber}
                        </span>
                      </>
                    ) : (
                      <span style={styles.pending}>No vehicle selected</span>
                    )}
                  </div>
                </div>

                {/* Down Payment */}
                <div style={styles.quadrant}>
                  <h4 style={styles.quadrantTitle}>DOWN PAYMENT</h4>
                  <div style={styles.quadrantContent}>
                    {selectedSession.budget?.downPaymentPercent ? (
                      <span style={styles.bigValue}>
                        {selectedSession.budget.downPaymentPercent}%
                      </span>
                    ) : (
                      <span style={styles.pending}>Not specified</span>
                    )}
                  </div>
                </div>

                {/* Monthly Budget */}
                <div style={styles.quadrant}>
                  <h4 style={styles.quadrantTitle}>MONTHLY BUDGET</h4>
                  <div style={styles.quadrantContent}>
                    {selectedSession.budget?.min || selectedSession.budget?.max ? (
                      <span style={styles.budgetRange}>
                        ${selectedSession.budget.min || 0} - ${selectedSession.budget.max || '∞'}
                      </span>
                    ) : (
                      <span style={styles.pending}>Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Interest */}
              {selectedSession.vehicleInterest?.model && (
                <div style={styles.interestSection}>
                  <h4 style={styles.sectionTitle}>Vehicle Interest</h4>
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
            </div>
          )}
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Montserrat", sans-serif',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    background: '#1a1a1a',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  lastUpdate: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: 'rgba(27,115,64,0.2)',
    border: '1px solid rgba(27,115,64,0.4)',
    borderRadius: '6px',
    color: '#4ade80',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  homeBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Main Content
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px',
    padding: '24px 32px',
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
    color: 'rgba(255,255,255,0.5)',
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
    color: 'rgba(255,255,255,0.5)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  sessionCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sessionCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sessionCardActive: {
    background: 'rgba(27,115,64,0.15)',
    border: '1px solid #1B7340',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  customerName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  sessionTime: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  sessionStep: {
    fontSize: '13px',
    color: '#4ade80',
    marginBottom: '4px',
  },
  sessionPhone: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },

  // Detail Panel
  detailPanel: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  noSelection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '400px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '16px',
  },

  // Worksheet
  worksheet: {
    padding: '24px',
  },
  worksheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  worksheetTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  viewChatBtn: {
    padding: '10px 16px',
    background: 'rgba(96,165,250,0.2)',
    border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: '8px',
    color: '#60a5fa',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // 4-Square Grid
  fourSquareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  quadrant: {
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    minHeight: '150px',
  },
  quadrantTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  quadrantContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tradeVehicleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '12px',
  },
  tradeModel: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  tradeMileage: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  payoffInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  payoffRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
  },
  paidOff: {
    color: '#4ade80',
    fontWeight: 600,
  },
  noTrade: {
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  pending: {
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
  bigPrice: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#4ade80',
  },
  budgetRange: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#60a5fa',
  },
  bigValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
  },
  subValue: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },

  // Interest Section
  interestSection: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '12px',
  },
  interestDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
  },

  // Chat Transcript
  chatTranscript: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  transcriptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  chatMessages: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  chatMessage: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: 'rgba(27,115,64,0.2)',
    border: '1px solid rgba(27,115,64,0.3)',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  messageRole: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'block',
  },
  messageContent: {
    fontSize: '14px',
    color: '#fff',
    margin: 0,
    lineHeight: 1.5,
  },
};

export default SalesManagerDashboard;
