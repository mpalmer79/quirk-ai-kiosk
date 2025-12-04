import React, { useState, useEffect } from 'react';
import api from './api';

const TrafficLog = ({ navigateTo }) => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // 'today', 'vehicle', 'requested', 'completed', 'chat'

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Build query params based on active filter
      const params = { limit: 100 };
      if (activeFilter === 'today') {
        params.filter_today = true;
      }
      
      const [logData, statsData] = await Promise.all([
        api.getTrafficLog(params.limit, 0, params.filter_today),
        api.getTrafficStats()
      ]);
      
      let sessionList = logData.sessions || [];
      
      // Client-side filtering for other filter types
      if (activeFilter === 'vehicle') {
        sessionList = sessionList.filter(s => s.vehicle);
      } else if (activeFilter === 'requested') {
        sessionList = sessionList.filter(s => s.vehicleRequested);
      } else if (activeFilter === 'completed') {
        sessionList = sessionList.filter(s => s.phone);
      } else if (activeFilter === 'chat') {
        sessionList = sessionList.filter(s => s.chatHistory && s.chatHistory.length > 0);
      }
      
      setSessions(sessionList);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load traffic data:', err);
      setError('Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatCardClick = (filterType) => {
    // Toggle filter - if already active, clear it
    if (activeFilter === filterType) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filterType);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Parse the date - timestamps are already in EST from backend
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatChatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getPathLabel = (path) => {
    const labels = {
      stockLookup: 'Stock Lookup',
      modelBudget: 'Model & Budget',
      guidedQuiz: 'Guided Quiz',
      browse: 'Browse All',
      aiChat: 'AI Chat'
    };
    return labels[path] || path || 'Unknown';
  };

  const getPathColor = (path) => {
    const colors = {
      stockLookup: '#1B7340',
      modelBudget: '#2563eb',
      guidedQuiz: '#dc2626',
      browse: '#6b7280',
      aiChat: '#8b5cf6'
    };
    return colors[path] || '#6b7280';
  };

  if (loading && !refreshing) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading traffic data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.errorIcon}>⚠️</div>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryButton} onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={() => navigateTo('welcome')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Kiosk
          </button>
          <h1 style={styles.title}>Traffic Log</h1>
          <span style={styles.subtitle}>Kiosk Session Monitor</span>
        </div>
        <div style={styles.headerRight}>
          {activeFilter && (
            <button 
              style={styles.clearFilterButton}
              onClick={() => setActiveFilter(null)}
            >
              Clear Filter ✕
            </button>
          )}
          <button 
            style={styles.refreshButton} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none' 
              }}
            >
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards - Now Clickable */}
      {stats && (
        <div style={styles.statsGrid}>
          <div 
            style={{
              ...styles.statCard,
              ...(activeFilter === 'today' ? styles.statCardActive : {}),
              cursor: 'pointer'
            }}
            onClick={() => handleStatCardClick('today')}
          >
            <span style={styles.statValue}>{stats.today || 0}</span>
            <span style={styles.statLabel}>Today</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{stats.total_sessions || 0}</span>
            <span style={styles.statLabel}>Total Sessions</span>
          </div>
          <div 
            style={{
              ...styles.statCard,
              ...(activeFilter === 'vehicle' ? styles.statCardActive : {}),
              cursor: 'pointer'
            }}
            onClick={() => handleStatCardClick('vehicle')}
          >
            <span style={styles.statValue}>{stats.with_vehicle_selected || 0}</span>
            <span style={styles.statLabel}>Viewed Vehicle</span>
          </div>
          <div 
            style={{
              ...styles.statCard,
              ...(activeFilter === 'requested' ? styles.statCardActive : {}),
              cursor: 'pointer'
            }}
            onClick={() => handleStatCardClick('requested')}
          >
            <span style={styles.statValue}>{stats.vehicle_requests || 0}</span>
            <span style={styles.statLabel}>Requested Vehicle</span>
          </div>
          <div 
            style={{
              ...styles.statCard,
              ...(activeFilter === 'completed' ? styles.statCardActive : {}),
              cursor: 'pointer'
            }}
            onClick={() => handleStatCardClick('completed')}
          >
            <span style={styles.statValue}>{stats.completed_handoffs || 0}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ 
              ...styles.statValue, 
              color: stats.conversion_rate > 0 ? '#4ade80' : '#ef4444' 
            }}>
              {stats.conversion_rate || 0}%
            </span>
            <span style={styles.statLabel}>Conversion</span>
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {activeFilter && (
        <div style={styles.filterIndicator}>
          Showing: {activeFilter === 'today' ? "Today's Sessions" : 
                    activeFilter === 'vehicle' ? 'Sessions with Vehicle Viewed' :
                    activeFilter === 'requested' ? 'Sessions with Vehicle Requested' :
                    activeFilter === 'completed' ? 'Completed Sessions' :
                    activeFilter === 'chat' ? 'Sessions with AI Chat' : 'All'}
          {' '}({sessions.length} results)
        </div>
      )}

      {/* Sessions Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Path</th>
              <th style={styles.th}>Vehicle</th>
              <th style={styles.th}>Trade-In</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>
                  {activeFilter ? 'No sessions match this filter' : 'No sessions recorded yet'}
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr 
                  key={session.sessionId} 
                  style={styles.tr}
                  onClick={() => setSelectedSession(session)}
                >
                  <td style={styles.td}>
                    <span style={styles.timeValue}>{formatDate(session.createdAt)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.customerCell}>
                      <span style={styles.customerName}>
                        {session.customerName || 'Anonymous'}
                      </span>
                      {session.phone && (
                        <span style={styles.customerPhone}>
                          {formatPhone(session.phone)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span 
                      style={{ 
                        ...styles.pathBadge,
                        background: `${getPathColor(session.path)}20`,
                        color: getPathColor(session.path)
                      }}
                    >
                      {getPathLabel(session.path)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {session.vehicle ? (
                      <div style={styles.vehicleCell}>
                        <span style={styles.vehicleName}>
                          {session.vehicle.year} {session.vehicle.model}
                        </span>
                        <span style={styles.vehicleStock}>
                          #{session.vehicle.stockNumber}
                        </span>
                      </div>
                    ) : (
                      <span style={styles.emptyCell}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {session.tradeIn ? (
                      <div style={styles.tradeCell}>
                        <span style={styles.tradeName}>
                          {session.tradeIn.year} {session.tradeIn.make}
                        </span>
                        {session.tradeIn.estimatedValue && (
                          <span style={styles.tradeValue}>
                            ~${session.tradeIn.estimatedValue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={styles.emptyCell}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.statusCell}>
                      {session.phone ? (
                        <span style={styles.statusComplete}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Completed
                        </span>
                      ) : session.vehicleRequested ? (
                        <span style={styles.statusRequested}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          Requested
                        </span>
                      ) : (
                        <span style={styles.statusBrowsing}>Browsing</span>
                      )}
                      {session.chatHistory && session.chatHistory.length > 0 && (
                        <span style={styles.chatBadge} title="Has AI Chat History">
                          💬 {session.chatHistory.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSession(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Session Details</h2>
              <button 
                style={styles.closeButton}
                onClick={() => setSelectedSession(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div style={styles.modalContent}>
              {/* Customer Info */}
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Customer</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Name</span>
                    <span style={styles.detailValue}>
                      {selectedSession.customerName || 'Anonymous'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Phone</span>
                    <span style={styles.detailValue}>
                      {formatPhone(selectedSession.phone) || 'Not provided'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Path</span>
                    <span style={styles.detailValue}>
                      {getPathLabel(selectedSession.path)}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Session ID</span>
                    <span style={{ ...styles.detailValue, fontFamily: 'monospace', fontSize: '12px' }}>
                      {selectedSession.sessionId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedSession.vehicle && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>Vehicle Interest</h3>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Vehicle</span>
                      <span style={styles.detailValue}>
                        {selectedSession.vehicle.year} {selectedSession.vehicle.make} {selectedSession.vehicle.model}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Trim</span>
                      <span style={styles.detailValue}>
                        {selectedSession.vehicle.trim || 'N/A'}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Stock #</span>
                      <span style={styles.detailValue}>
                        {selectedSession.vehicle.stockNumber}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Price</span>
                      <span style={styles.detailValue}>
                        ${selectedSession.vehicle.salePrice?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade-In Info */}
              {selectedSession.tradeIn && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>Trade-In</h3>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Vehicle</span>
                      <span style={styles.detailValue}>
                        {selectedSession.tradeIn.year} {selectedSession.tradeIn.make} {selectedSession.tradeIn.model}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Mileage</span>
                      <span style={styles.detailValue}>
                        {selectedSession.tradeIn.mileage?.toLocaleString() || 'N/A'} mi
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Condition</span>
                      <span style={styles.detailValue}>
                        {selectedSession.tradeIn.condition || 'N/A'}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Est. Value</span>
                      <span style={{ ...styles.detailValue, color: '#4ade80' }}>
                        ${selectedSession.tradeIn.estimatedValue?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              {selectedSession.payment && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>Payment Preference</h3>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Type</span>
                      <span style={styles.detailValue}>
                        {selectedSession.payment.type === 'lease' ? 'Lease' : 'Finance'}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Monthly</span>
                      <span style={styles.detailValue}>
                        ${selectedSession.payment.monthly}/mo
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Term</span>
                      <span style={styles.detailValue}>
                        {selectedSession.payment.term} months
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Down Payment</span>
                      <span style={styles.detailValue}>
                        ${selectedSession.payment.downPayment?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Chat History */}
              {selectedSession.chatHistory && selectedSession.chatHistory.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>
                    AI Chat History ({selectedSession.chatHistory.length} messages)
                  </h3>
                  <div style={styles.chatHistoryContainer}>
                    {selectedSession.chatHistory.map((msg, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          ...styles.chatMessage,
                          ...(msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant)
                        }}
                      >
                        <div style={styles.chatMessageHeader}>
                          <span style={styles.chatRole}>
                            {msg.role === 'user' ? '👤 Customer' : '🤖 AI Assistant'}
                          </span>
                          {msg.timestamp && (
                            <span style={styles.chatTimestamp}>
                              {formatChatTime(msg.timestamp)}
                            </span>
                          )}
                        </div>
                        <div style={styles.chatContent}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Timeline</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Started</span>
                    <span style={styles.detailValue}>
                      {formatDate(selectedSession.createdAt)}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Last Activity</span>
                    <span style={styles.detailValue}>
                      {formatDate(selectedSession.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: '24px 40px',
    overflow: 'auto',
    background: '#0a0a0a',
    minHeight: '100vh',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    color: 'rgba(255,255,255,0.6)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '16px',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '10px 24px',
    background: 'rgba(27, 115, 64, 0.2)',
    border: '1px solid rgba(27, 115, 64, 0.3)',
    borderRadius: '8px',
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.7)',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  clearFilterButton: {
    padding: '10px 16px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(27, 115, 64, 0.2)',
    border: '1px solid rgba(27, 115, 64, 0.3)',
    borderRadius: '8px',
    color: '#4ade80',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.2s ease',
  },
  statCardActive: {
    background: 'rgba(27, 115, 64, 0.15)',
    border: '1px solid rgba(27, 115, 64, 0.4)',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  filterIndicator: {
    padding: '12px 16px',
    background: 'rgba(27, 115, 64, 0.1)',
    border: '1px solid rgba(27, 115, 64, 0.2)',
    borderRadius: '8px',
    color: '#4ade80',
    fontSize: '13px',
    marginBottom: '16px',
  },
  tableContainer: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px 20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  td: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'middle',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
  },
  timeValue: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
  },
  customerCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  customerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  customerPhone: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  pathBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  vehicleCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vehicleName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  vehicleStock: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  tradeCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tradeName: {
    fontSize: '14px',
    color: '#ffffff',
  },
  tradeValue: {
    fontSize: '12px',
    color: '#4ade80',
  },
  emptyCell: {
    color: 'rgba(255,255,255,0.2)',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusComplete: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(74, 222, 128, 0.15)',
    color: '#4ade80',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusRequested: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(251, 191, 36, 0.15)',
    color: '#fbbf24',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusBrowsing: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '600',
  },
  chatBadge: {
    fontSize: '12px',
    padding: '2px 6px',
    background: 'rgba(139, 92, 246, 0.2)',
    borderRadius: '4px',
    color: '#a78bfa',
  },
  viewButton: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    background: '#1a1a1a',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    padding: '4px',
  },
  modalContent: {
    padding: '24px',
    overflow: 'auto',
  },
  detailSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    margin: '0 0 12px 0',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  // Chat History Styles
  chatHistoryContainer: {
    maxHeight: '300px',
    overflow: 'auto',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    padding: '12px',
  },
  chatMessage: {
    marginBottom: '12px',
    padding: '12px',
    borderRadius: '8px',
  },
  chatMessageUser: {
    background: 'rgba(37, 99, 235, 0.15)',
    borderLeft: '3px solid #2563eb',
  },
  chatMessageAssistant: {
    background: 'rgba(27, 115, 64, 0.15)',
    borderLeft: '3px solid #1B7340',
  },
  chatMessageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  chatRole: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  chatTimestamp: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
  chatContent: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
};

export default TrafficLog;
