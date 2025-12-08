import React, { useState, useEffect } from 'react';
import api from './api';

interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp?: string; }
interface TradeInVehicle { year: string | null; make: string | null; model: string | null; mileage: number | null; }
interface CustomerSession {
  sessionId: string; customerName: string | null; phone: string | null; startTime: string; lastActivity: string; currentStep: string;
  vehicleInterest: { model: string | null; cab: string | null; colors: string[]; };
  budget: { min: number | null; max: number | null; downPaymentPercent: number | null; };
  tradeIn: { hasTrade: boolean | null; vehicle: TradeInVehicle | null; hasPayoff: boolean | null; payoffAmount: number | null; monthlyPayment: number | null; financedWith: string | null; };
  selectedVehicle: { stockNumber: string | null; year: number | null; make: string | null; model: string | null; trim: string | null; price: number | null; } | null;
  chatHistory?: ChatMessage[];
}
interface SessionDetail {
  sessionId: string; customerName?: string; phone?: string; path?: string; currentStep?: string; createdAt: string; updatedAt: string;
  vehicleInterest?: any; budget?: any; tradeIn?: any; vehicle?: any; chatHistory?: ChatMessage[]; actions?: string[];
}

const STEP_LABELS: Record<string, string> = {
  welcome: 'Welcome Screen', category: 'Selecting Category', model: 'Selecting Model', cab: 'Selecting Cab',
  colors: 'Choosing Colors', budget: 'Setting Budget', tradeIn: 'Trade-In Info', 'trade-in': 'Trade-In Info', inventory: 'Browsing Inventory',
  vehicleDetail: 'Viewing Vehicle', handoff: 'Ready for Handoff', aiChat: 'AI Assistant Chat', aiAssistant: 'AI Assistant Chat',
  modelBudget: 'Model & Budget Flow', stockLookup: 'Stock Lookup', guidedQuiz: 'Guided Quiz', browse: 'Browsing',
  browsing: 'Browsing', name_entered: 'Just Started',
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
      const data = await api.getActiveSessions(60); // Increased timeout to 60 minutes
      setSessions(data.sessions || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) { console.error('Error fetching sessions:', err); }
    finally { setLoading(false); }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    setLoadingDetail(true);
    try { setSessionDetail(await api.getTrafficSession(sessionId)); }
    catch (err) { console.error('Error fetching session detail:', err); }
    finally { setLoadingDetail(false); }
  };

  useEffect(() => {
    fetchSessions();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) interval = setInterval(fetchSessions, 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find(s => s.sessionId === selectedSession.sessionId);
      if (updated) setSelectedSession(updated);
      fetchSessionDetail(selectedSession.sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, selectedSession?.sessionId]);

  const handleSessionSelect = (session: CustomerSession) => {
    setSelectedSession(session);
    setShowChatTranscript(false);
    fetchSessionDetail(session.sessionId);
  };

  const handleGoHome = () => {
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
  const formatCurrency = (val: number | null) => val == null ? '—' : `$${val.toLocaleString()}`;
  const formatTime = (ts?: string) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return ''; }
  };
  const isAIChatSession = (step: string) => ['aiChat', 'aiAssistant', 'AI Assistant Chat'].includes(step);

  const renderChatTranscript = () => {
    const chatHistory = sessionDetail?.chatHistory || [];
    if (chatHistory.length === 0) {
      return (
        <div style={s.noChat}>
          <p>No conversation history available yet.</p>
          <p style={s.noChatSubtext}>The customer hasn't started chatting with the AI assistant.</p>
        </div>
      );
    }
    return (
      <div style={s.chatContainer}>
        <div style={s.chatHeader}>
          <h3 style={s.chatTitle}>💬 Customer Chat with Quirk AI</h3>
          <span style={s.chatCount}>{chatHistory.length} messages</span>
        </div>
        <div style={s.chatMessages}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ ...s.chatMessage, ...(msg.role === 'user' ? s.userMessage : s.assistantMessage) }}>
              <div style={s.chatMsgHeader}>
                <span style={s.chatRole}>{msg.role === 'user' ? `👤 ${selectedSession?.customerName || 'Customer'}` : '🤖 Quirk AI'}</span>
                <span style={s.chatTime}>{formatTime(msg.timestamp)}</span>
              </div>
              <p style={s.chatContent}>{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFourSquare = (session: CustomerSession) => (
    <div style={s.fourSquare}>
      <div style={s.fourSquareHeader}>
        <h2 style={s.fourSquareTitle}>📋 Digital 4-Square Worksheet</h2>
        <span style={s.sessionTime}>Started {getTimeSince(session.startTime)}</span>
      </div>
      <div style={s.customerInfoBar}>
        <div style={s.infoItem}><span style={s.infoLabel}>Name</span><span style={s.infoValue}>{session.customerName || '—'}</span></div>
        <div style={s.infoItem}><span style={s.infoLabel}>Phone</span><span style={s.infoValue}>{session.phone || '—'}</span></div>
        <div style={s.infoItem}><span style={s.infoLabel}>Status</span><span style={{ ...s.infoValue, color: '#4ade80' }}>{getStepLabel(session.currentStep)}</span></div>
      </div>
      <div style={s.vehicleSection}>
        <h3 style={s.sectionTitle}>🚗 Vehicle Interest</h3>
        <div style={s.vehicleGrid}>
          <div style={s.vehicleField}><span style={s.fieldLabel}>Model</span><span style={s.fieldValue}>{session.vehicleInterest?.model || '—'}</span></div>
          <div style={s.vehicleField}><span style={s.fieldLabel}>Cab/Config</span><span style={s.fieldValue}>{session.vehicleInterest?.cab || '—'}</span></div>
          <div style={s.vehicleField}><span style={s.fieldLabel}>Color Pref</span><span style={s.fieldValue}>{session.vehicleInterest?.colors?.join(', ') || '—'}</span></div>
        </div>
        {session.selectedVehicle && (
          <div style={s.selectedVehicleCard}>
            <span style={s.selectedLabel}>✓ Selected Vehicle</span>
            <span style={s.selectedVehicle}>{session.selectedVehicle.year} {session.selectedVehicle.make} {session.selectedVehicle.model} {session.selectedVehicle.trim}</span>
            <span style={s.selectedPrice}>{formatCurrency(session.selectedVehicle.price)}</span>
          </div>
        )}
      </div>
      {isAIChatSession(session.currentStep) && (
        <button style={s.viewChatBtn} onClick={() => setShowChatTranscript(!showChatTranscript)}>
          💬 {showChatTranscript ? 'Hide' : 'View'} AI Chat Transcript
          {sessionDetail?.chatHistory?.length ? ` (${sessionDetail.chatHistory.length} messages)` : ''}
        </button>
      )}
      {showChatTranscript && (loadingDetail ? <div style={s.loadingChat}>Loading chat history...</div> : renderChatTranscript())}
      <div style={s.fourSquareGrid}>
        {/* Trade-In */}
        <div style={s.quadrant}>
          <h4 style={s.quadrantTitle}>TRADE-IN</h4>
          {session.tradeIn?.hasTrade === true && session.tradeIn?.vehicle ? (
            <div style={s.quadrantContent}>
              <div style={s.tradeVehicleInfo}>
                <span>{session.tradeIn.vehicle.year} {session.tradeIn.vehicle.make}</span>
                <span style={s.tradeModel}>{session.tradeIn.vehicle.model}</span>
                <span style={s.tradeMileage}>{session.tradeIn.vehicle.mileage ? `${session.tradeIn.vehicle.mileage.toLocaleString()} miles` : '— miles'}</span>
              </div>
              {session.tradeIn.hasPayoff && (
                <div style={s.payoffInfo}>
                  {[{ label: 'Payoff:', value: formatCurrency(session.tradeIn.payoffAmount) }, { label: 'Current Pmt:', value: `${formatCurrency(session.tradeIn.monthlyPayment)}/mo` }, { label: 'Lender:', value: session.tradeIn.financedWith || '—' }].map((row, i) => (
                    <div key={i} style={s.payoffRow}><span>{row.label}</span><strong>{row.value}</strong></div>
                  ))}
                </div>
              )}
              {session.tradeIn.hasPayoff === false && <span style={s.paidOff}>✓ Paid Off / No Loan</span>}
            </div>
          ) : session.tradeIn?.hasTrade === false ? <span style={s.noTrade}>No Trade-In</span> : <span style={s.pending}>Pending...</span>}
        </div>
        {/* Price */}
        <div style={s.quadrant}>
          <h4 style={s.quadrantTitle}>PRICE</h4>
          <div style={s.quadrantContent}>
            {session.selectedVehicle ? <span style={s.bigPrice}>{formatCurrency(session.selectedVehicle.price)}</span>
              : session.budget?.max ? <span style={s.budgetRange}>Budget: {formatCurrency(session.budget.min)} - {formatCurrency(session.budget.max)}</span>
              : <span style={s.pending}>No vehicle selected</span>}
          </div>
        </div>
        {/* Cash Down */}
        <div style={s.quadrant}>
          <h4 style={s.quadrantTitle}>CASH DOWN</h4>
          <div style={s.quadrantContent}>
            {session.budget?.downPaymentPercent != null ? (<><span style={s.bigValue}>{session.budget.downPaymentPercent}%</span><span style={s.subValue}>Down Payment</span></>) : <span style={s.pending}>Pending...</span>}
          </div>
        </div>
        {/* Monthly Payment */}
        <div style={s.quadrant}>
          <h4 style={s.quadrantTitle}>MONTHLY PAYMENTS</h4>
          <div style={s.quadrantContent}>
            {session.budget?.min || session.budget?.max ? (<><span style={s.bigValue}>{formatCurrency(session.budget.min)} - {formatCurrency(session.budget.max)}</span><span style={s.subValue}>Target Range</span></>) : <span style={s.pending}>Pending...</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={s.container}>
        <div style={s.loadingContainer}><div style={s.spinner} /><p>Loading active sessions...</p></div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.headerTitle}>📊 Sales Manager Dashboard</h1>
        <div style={s.headerActions}>
          <span style={s.lastUpdate}>Last update: {lastUpdate}</span>
          <label style={s.autoRefreshLabel}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={s.checkbox} />
            Auto-refresh (5s)
          </label>
          <button style={s.refreshBtn} onClick={fetchSessions}>🔄 Refresh Now</button>
        </div>
      </div>
      <div style={s.content}>
        <div style={s.sessionsList}>
          {/* HOME Button */}
          <button style={s.homeButton} onClick={handleGoHome}>
            HOME
          </button>
          <h3 style={s.sectionHeader}>ACTIVE KIOSK SESSIONS ({sessions.length})</h3>
          {sessions.length === 0 ? (
            <div style={s.emptyState}>
              <p>No active sessions</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Sessions will appear when customers use the kiosk</p>
              <p style={{ fontSize: '12px', marginTop: '12px', color: 'rgba(255,255,255,0.3)' }}>
                Note: Each kiosk device creates its own session. Open the kiosk in a different browser or device to test multiple sessions.
              </p>
            </div>
          ) : sessions.map((session) => (
            <button key={session.sessionId} style={{ ...s.sessionCard, ...(selectedSession?.sessionId === session.sessionId ? s.sessionCardActive : {}) }} onClick={() => handleSessionSelect(session)}>
              <div style={s.sessionCardHeader}>
                <span style={s.sessionName}>{session.customerName || 'Anonymous'}</span>
                <span style={s.sessionStatus}>{getStepLabel(session.currentStep)}</span>
              </div>
              <div style={s.sessionCardDetails}><span>{getStepLabel(session.currentStep)}</span><span>{getTimeSince(session.lastActivity)}</span></div>
            </button>
          ))}
        </div>
        <div style={s.detailPanel}>
          {selectedSession ? renderFourSquare(selectedSession) : (
            <div style={s.selectPrompt}><span style={s.selectIcon}>👈</span><p>Select a session to view the 4-square worksheet</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '24px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' },
  spinner: { width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#1B7340', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  headerTitle: { fontSize: '24px', fontWeight: 700, margin: 0 },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  lastUpdate: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  autoRefreshLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' },
  checkbox: { cursor: 'pointer' },
  refreshBtn: { padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  content: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' },
  sessionsList: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' },
  homeButton: { 
    width: '100%', 
    padding: '12px 16px', 
    background: 'transparent', 
    border: 'none', 
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', 
    fontSize: '24px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    textAlign: 'left',
    marginBottom: '16px',
    letterSpacing: '0.5px',
  },
  sectionHeader: { fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '16px', textTransform: 'uppercase' },
  emptyState: { padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' },
  sessionCard: { width: '100%', textAlign: 'left', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s ease' },
  sessionCardActive: { borderColor: '#1B7340', background: 'rgba(27,115,64,0.15)' },
  sessionCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  sessionName: { fontSize: '16px', fontWeight: 600, color: '#fff' },
  sessionStatus: { fontSize: '11px', padding: '4px 8px', background: 'rgba(74,222,128,0.15)', borderRadius: '4px', color: '#4ade80' },
  sessionCardDetails: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  detailPanel: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '24px', maxHeight: 'calc(100vh - 140px)' },
  selectPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'rgba(255,255,255,0.4)', gap: '16px' },
  selectIcon: { fontSize: '48px' },
  fourSquare: { maxWidth: '900px', margin: '0 auto' },
  fourSquareHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  fourSquareTitle: { fontSize: '20px', fontWeight: 700, margin: 0 },
  sessionTime: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
  customerInfoBar: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '20px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  infoValue: { fontSize: '16px', fontWeight: 600, color: '#fff' },
  viewChatBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.2) 100%)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '10px', color: '#a78bfa', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' },
  chatContainer: { background: 'rgba(139,92,246,0.1)', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(139,92,246,0.2)' },
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  chatTitle: { fontSize: '16px', fontWeight: 600, margin: 0, color: '#a78bfa' },
  chatCount: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  chatMessages: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' },
  chatMessage: { padding: '12px 16px', borderRadius: '10px' },
  userMessage: { background: 'rgba(27,115,64,0.2)', marginLeft: '20px' },
  assistantMessage: { background: 'rgba(255,255,255,0.05)', marginRight: '20px' },
  chatMsgHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  chatRole: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  chatTime: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
  chatContent: { fontSize: '14px', lineHeight: 1.5, color: '#fff', margin: 0, whiteSpace: 'pre-wrap' },
  noChat: { textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' },
  noChatSubtext: { fontSize: '13px', marginTop: '8px' },
  loadingChat: { textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' },
  vehicleSection: { padding: '16px', background: 'rgba(37,99,235,0.1)', borderRadius: '10px', marginBottom: '20px' },
  sectionTitle: { fontSize: '14px', fontWeight: 600, color: '#60a5fa', marginBottom: '12px' },
  vehicleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  vehicleField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  fieldLabel: { fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  fieldValue: { fontSize: '15px', color: '#fff' },
  selectedVehicleCard: { marginTop: '16px', padding: '12px', background: 'rgba(74,222,128,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  selectedLabel: { fontSize: '10px', fontWeight: 600, color: '#4ade80', textTransform: 'uppercase' },
  selectedVehicle: { fontSize: '15px', fontWeight: 600, color: '#fff' },
  selectedPrice: { fontSize: '18px', fontWeight: 700, color: '#4ade80' },
  fourSquareGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  quadrant: { padding: '20px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', minHeight: '150px' },
  quadrantTitle: { fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  quadrantContent: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tradeVehicleInfo: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' },
  tradeModel: { fontSize: '18px', fontWeight: 700, color: '#fff' },
  tradeMileage: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  payoffInfo: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' },
  payoffRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'rgba(255,255,255,0.8)' },
  paidOff: { color: '#4ade80', fontWeight: 600 },
  noTrade: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  pending: { color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  bigPrice: { fontSize: '32px', fontWeight: 700, color: '#4ade80' },
  budgetRange: { fontSize: '18px', fontWeight: 600, color: '#60a5fa' },
  bigValue: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  subValue: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
};

export default SalesManagerDashboard;
