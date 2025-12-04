import React, { useState, useEffect } from 'react';
import api from './api';

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

const SalesManagerDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CustomerSession | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      const data = await api.getActiveSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Auto-refresh every 5 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSessions, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStepLabel = (step: string): string => {
    const steps: Record<string, string> = {
      'welcome': 'Welcome Screen',
      'category': 'Selecting Category',
      'model': 'Selecting Model',
      'cab': 'Selecting Cab',
      'colors': 'Choosing Colors',
      'budget': 'Setting Budget',
      'tradeIn': 'Trade-In Info',
      'inventory': 'Browsing Inventory',
      'vehicleDetail': 'Viewing Vehicle',
      'handoff': 'Ready for Handoff',
      'aiChat': 'AI Assistant Chat',
    };
    return steps[step] || step;
  };

  const getTimeSince = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  const formatCurrency = (val: number | null): string => {
    if (val === null) return '—';
    return `$${val.toLocaleString()}`;
  };

  const renderFourSquare = (session: CustomerSession) => (
    <div style={styles.fourSquareContainer}>
      <div style={styles.fourSquareHeader}>
        <h2 style={styles.fourSquareTitle}>📋 Digital 4-Square Worksheet</h2>
        <span style={styles.sessionTime}>Started {getTimeSince(session.startTime)}</span>
      </div>

      {/* Top Section - Customer Info */}
      <div style={styles.customerInfoBar}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>NAME</span>
          <span style={styles.infoValue}>{session.customerName || '—'}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>PHONE</span>
          <span style={styles.infoValue}>{session.phone || '—'}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>STATUS</span>
          <span style={{...styles.infoValue, color: '#4ade80'}}>{getStepLabel(session.currentStep)}</span>
        </div>
      </div>

      {/* Vehicle Interest Section */}
      <div style={styles.vehicleSection}>
        <h3 style={styles.sectionTitle}>🚗 Vehicle Interest</h3>
        <div style={styles.vehicleGrid}>
          <div style={styles.vehicleField}>
            <span style={styles.fieldLabel}>MODEL</span>
            <span style={styles.fieldValue}>{session.vehicleInterest.model || '—'}</span>
          </div>
          <div style={styles.vehicleField}>
            <span style={styles.fieldLabel}>CAB/CONFIG</span>
            <span style={styles.fieldValue}>{session.vehicleInterest.cab || '—'}</span>
          </div>
          <div style={styles.vehicleField}>
            <span style={styles.fieldLabel}>COLOR PREF</span>
            <span style={styles.fieldValue}>
              {session.vehicleInterest.colors.length > 0 
                ? session.vehicleInterest.colors.join(', ') 
                : '—'}
            </span>
          </div>
        </div>
        
        {session.selectedVehicle && (
          <div style={styles.selectedVehicleCard}>
            <span style={styles.selectedLabel}>SELECTED VEHICLE</span>
            <span style={styles.selectedVehicle}>
              Stock #{session.selectedVehicle.stockNumber} — {session.selectedVehicle.year} {session.selectedVehicle.make} {session.selectedVehicle.model} {session.selectedVehicle.trim}
            </span>
            <span style={styles.selectedPrice}>{formatCurrency(session.selectedVehicle.price)}</span>
          </div>
        )}
      </div>

      {/* 4-Square Grid */}
      <div style={styles.fourSquareGrid}>
        {/* Trade-In Quadrant */}
        <div style={styles.quadrant}>
          <h4 style={styles.quadrantTitle}>TRADE-IN</h4>
          {session.tradeIn.hasTrade === true && session.tradeIn.vehicle ? (
            <div style={styles.quadrantContent}>
              <div style={styles.tradeVehicleInfo}>
                <span>{session.tradeIn.vehicle.year} {session.tradeIn.vehicle.make}</span>
                <span style={styles.tradeModel}>{session.tradeIn.vehicle.model}</span>
                <span style={styles.tradeMileage}>
                  {session.tradeIn.vehicle.mileage 
                    ? `${session.tradeIn.vehicle.mileage.toLocaleString()} miles` 
                    : '— miles'}
                </span>
              </div>
              {session.tradeIn.hasPayoff && (
                <div style={styles.payoffInfo}>
                  <div style={styles.payoffRow}>
                    <span>Payoff:</span>
                    <strong>{formatCurrency(session.tradeIn.payoffAmount)}</strong>
                  </div>
                  <div style={styles.payoffRow}>
                    <span>Current Pmt:</span>
                    <strong>{formatCurrency(session.tradeIn.monthlyPayment)}/mo</strong>
                  </div>
                  <div style={styles.payoffRow}>
                    <span>Lender:</span>
                    <strong>{session.tradeIn.financedWith || '—'}</strong>
                  </div>
                </div>
              )}
              {session.tradeIn.hasPayoff === false && (
                <span style={styles.paidOff}>✓ Paid Off / No Loan</span>
              )}
            </div>
          ) : session.tradeIn.hasTrade === false ? (
            <span style={styles.noTrade}>No Trade-In</span>
          ) : (
            <span style={styles.pending}>Pending...</span>
          )}
        </div>

        {/* Price Quadrant */}
        <div style={styles.quadrant}>
          <h4 style={styles.quadrantTitle}>PRICE</h4>
          <div style={styles.quadrantContent}>
            {session.selectedVehicle ? (
              <span style={styles.bigPrice}>{formatCurrency(session.selectedVehicle.price)}</span>
            ) : (
              <span style={styles.pending}>No vehicle selected</span>
            )}
          </div>
        </div>

        {/* Cash Down Quadrant */}
        <div style={styles.quadrant}>
          <h4 style={styles.quadrantTitle}>CASH DOWN</h4>
          <div style={styles.quadrantContent}>
            {session.budget.downPaymentPercent !== null ? (
              <>
                <span style={styles.bigValue}>{session.budget.downPaymentPercent}%</span>
                <span style={styles.subValue}>Down Payment</span>
              </>
            ) : (
              <span style={styles.pending}>Pending...</span>
            )}
          </div>
        </div>

        {/* Monthly Payment Quadrant */}
        <div style={styles.quadrant}>
          <h4 style={styles.quadrantTitle}>MONTHLY PAYMENTS</h4>
          <div style={styles.quadrantContent}>
            {session.budget.min !== null && session.budget.max !== null ? (
              <>
                <span style={styles.bigValue}>
                  {formatCurrency(session.budget.min)} - {formatCurrency(session.budget.max)}
                </span>
                <span style={styles.subValue}>Target Range /mo</span>
              </>
            ) : (
              <span style={styles.pending}>Pending...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p>Loading active sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Sales Manager Dashboard</h1>
        <div style={styles.headerControls}>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button style={styles.refreshButton} onClick={fetchSessions}>
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Sessions List */}
        <div style={styles.sessionsList}>
          <h2 style={styles.sectionHeader}>
            Active Kiosk Sessions ({sessions.length})
          </h2>
          {sessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No active kiosk sessions</p>
              <span>Sessions will appear here when customers start using the kiosk</span>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.sessionId}
                style={{
                  ...styles.sessionCard,
                  ...(selectedSession?.sessionId === session.sessionId ? styles.sessionCardActive : {}),
                }}
                onClick={() => setSelectedSession(session)}
              >
                <div style={styles.sessionCardHeader}>
                  <span style={styles.sessionName}>
                    {session.customerName || 'Guest Customer'}
                  </span>
                  <span style={styles.sessionStatus}>{getStepLabel(session.currentStep)}</span>
                </div>
                <div style={styles.sessionCardDetails}>
                  <span>{session.vehicleInterest.model || 'Browsing'}</span>
                  <span>{getTimeSince(session.lastActivity)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 4-Square Detail View */}
        <div style={styles.detailPanel}>
          {selectedSession ? (
            renderFourSquare(selectedSession)
          ) : (
            <div style={styles.selectPrompt}>
              <span style={styles.selectIcon}>👈</span>
              <p>Select a session to view the 4-square worksheet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#ffffff',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  },
  refreshButton: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    height: 'calc(100vh - 120px)',
  },
  sessionsList: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '16px',
    overflowY: 'auto',
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.5)',
  },
  sessionCard: {
    width: '100%',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  sessionCardActive: {
    background: 'rgba(27, 115, 64, 0.2)',
    borderColor: '#1B7340',
  },
  sessionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sessionName: {
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionStatus: {
    fontSize: '12px',
    padding: '4px 8px',
    background: 'rgba(74, 222, 128, 0.2)',
    borderRadius: '4px',
    color: '#4ade80',
  },
  sessionCardDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  detailPanel: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '24px',
    overflowY: 'auto',
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255,255,255,0.4)',
    gap: '16px',
  },
  selectIcon: {
    fontSize: '48px',
  },
  fourSquareContainer: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  fourSquareHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  fourSquareTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  sessionTime: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  customerInfoBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  vehicleSection: {
    padding: '16px',
    background: 'rgba(37, 99, 235, 0.1)',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: '12px',
  },
  vehicleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  vehicleField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: '15px',
    color: '#ffffff',
  },
  selectedVehicleCard: {
    marginTop: '16px',
    padding: '12px',
    background: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectedLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#4ade80',
    textTransform: 'uppercase',
  },
  selectedVehicle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#4ade80',
  },
  fourSquareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: '#4ade80',
  },
  bigValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
  },
  subValue: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
};

export default SalesManagerDashboard;
