import React, { useState, useEffect, CSSProperties } from 'react';
import api from './api';

interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp?: string; }
interface Stats {
  today?: number; total_sessions?: number; with_vehicle_selected?: number;
  vehicle_requests?: number; completed_handoffs?: number; conversion_rate?: number;
}
interface TrafficLogProps { navigateTo: (page: string) => void; }

const PATH_LABELS: Record<string, string> = { stockLookup: 'Stock Lookup', modelBudget: 'Model & Budget', guidedQuiz: 'Guided Quiz', browse: 'Browse All', aiChat: 'AI Chat' };
const PATH_COLORS: Record<string, string> = { stockLookup: '#1B7340', modelBudget: '#2563eb', guidedQuiz: '#dc2626', browse: '#6b7280', aiChat: '#8b5cf6' };

const TrafficLog: React.FC<TrafficLogProps> = ({ navigateTo }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, filter_today: activeFilter === 'today' };
      const [logData, statsData] = await Promise.all([api.getTrafficLog(params.limit, 0, params.filter_today), api.getTrafficStats()]);
      let sessionList = logData.sessions || [];
      if (activeFilter === 'vehicle') sessionList = sessionList.filter(s => s.vehicle);
      else if (activeFilter === 'requested') sessionList = sessionList.filter(s => s.vehicleRequested);
      else if (activeFilter === 'completed') sessionList = sessionList.filter(s => s.phone);
      else if (activeFilter === 'chat') sessionList = sessionList.filter(s => s.chatHistory && s.chatHistory.length > 0);
      setSessions(sessionList);
      setStats(statsData);
      setError(null);
    } catch (err) { console.error('Failed to load traffic data:', err); setError('Failed to load traffic data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [activeFilter]);

  const handleRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };
  const handleStatCardClick = (filterType: string) => setActiveFilter(activeFilter === filterType ? null : filterType);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const formatChatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 ? `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}` : phone;
  };
  const getPathLabel = (path?: string) => PATH_LABELS[path || ''] || path || 'Unknown';
  const getPathColor = (path?: string) => PATH_COLORS[path || ''] || '#6b7280';

  if (loading && !refreshing) {
    return <div style={s.container}><div style={s.loadingState}><div style={s.spinner} /><p>Loading traffic data...</p></div></div>;
  }
  if (error) {
    return <div style={s.container}><div style={s.loadingState}><div style={s.errorIcon}>⚠️</div><p style={s.errorText}>{error}</p><button style={s.retryBtn} onClick={loadData}>Try Again</button></div></div>;
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigateTo('welcome')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Kiosk
          </button>
          <h1 style={s.title}>Traffic Log</h1>
          <span style={s.subtitle}>Kiosk Session Monitor</span>
        </div>
        <div style={s.headerRight}>
          {activeFilter && <button style={s.clearFilterBtn} onClick={() => setActiveFilter(null)}>Clear Filter ✕</button>}
          <button style={s.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {stats && (
        <div style={s.statsGrid}>
          {[{ key: 'today', value: stats.today, label: 'Today', clickable: true },
            { key: 'total', value: stats.total_sessions, label: 'Total Sessions', clickable: false },
            { key: 'vehicle', value: stats.with_vehicle_selected, label: 'Viewed Vehicle', clickable: true },
            { key: 'requested', value: stats.vehicle_requests, label: 'Requested Vehicle', clickable: true },
            { key: 'completed', value: stats.completed_handoffs, label: 'Completed', clickable: true },
            { key: 'conversion', value: stats.conversion_rate, label: 'Conversion', clickable: false, isPercent: true }
          ].map(stat => (
            <div key={stat.key} style={{ ...s.statCard, ...(activeFilter === stat.key ? s.statCardActive : {}), cursor: stat.clickable ? 'pointer' : 'default' }}
              onClick={() => stat.clickable && handleStatCardClick(stat.key)}>
              <span style={{ ...s.statValue, ...(stat.isPercent ? { color: (stat.value || 0) > 0 ? '#4ade80' : '#ef4444' } : {}) }}>{stat.value || 0}{stat.isPercent ? '%' : ''}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {activeFilter && (
        <div style={s.filterIndicator}>
          Showing: {activeFilter === 'today' ? "Today's Sessions" : activeFilter === 'vehicle' ? 'Sessions with Vehicle Viewed' : activeFilter === 'requested' ? 'Sessions with Vehicle Requested' : activeFilter === 'completed' ? 'Completed Sessions' : activeFilter === 'chat' ? 'Sessions with AI Chat' : 'All'} ({sessions.length} results)
        </div>
      )}

      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>{['Time', 'Customer', 'Path', 'Vehicle', 'Trade-In', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan={7} style={s.emptyState}>{activeFilter ? 'No sessions match this filter' : 'No sessions recorded yet'}</td></tr>
            ) : sessions.map((session) => (
              <tr key={session.sessionId} style={s.tr} onClick={() => setSelectedSession(session)}>
                <td style={s.td}><span style={s.timeValue}>{formatDate(session.createdAt)}</span></td>
                <td style={s.td}>
                  <div style={s.customerCell}>
                    <span style={s.customerName}>{session.customerName || 'Anonymous'}</span>
                    {session.phone && <span style={s.customerPhone}>{formatPhone(session.phone)}</span>}
                  </div>
                </td>
                <td style={s.td}><span style={{ ...s.pathBadge, background: `${getPathColor(session.path)}20`, color: getPathColor(session.path) }}>{getPathLabel(session.path)}</span></td>
                <td style={s.td}>
                  {session.vehicle ? (
                    <div style={s.vehicleCell}><span style={s.vehicleName}>{session.vehicle.year} {session.vehicle.model}</span><span style={s.vehicleStock}>#{session.vehicle.stockNumber}</span></div>
                  ) : <span style={s.emptyCell}>—</span>}
                </td>
                <td style={s.td}>
                  {session.tradeIn ? (
                    <div style={s.tradeCell}><span style={s.tradeName}>{session.tradeIn.year} {session.tradeIn.make}</span>{session.tradeIn.estimatedValue && <span style={s.tradeValue}>~${session.tradeIn.estimatedValue.toLocaleString()}</span>}</div>
                  ) : <span style={s.emptyCell}>—</span>}
                </td>
                <td style={s.td}>
                  <div style={s.statusCell}>
                    {session.phone ? (
                      <span style={s.statusComplete}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Completed</span>
                    ) : session.vehicleRequested ? (
                      <span style={s.statusRequested}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Requested</span>
                    ) : <span style={s.statusBrowsing}>Browsing</span>}
                    {session.chatHistory && session.chatHistory.length > 0 && <span style={s.chatBadge} title="Has AI Chat History">💬 {session.chatHistory.length}</span>}
                  </div>
                </td>
                <td style={s.td}><button style={s.viewBtn} onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSession && (
        <div style={s.modalOverlay} onClick={() => setSelectedSession(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Session Details</h2>
              <button style={s.closeBtn} onClick={() => setSelectedSession(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={s.modalContent}>
              <div style={s.detailSection}>
                <h3 style={s.sectionTitle}>Customer</h3>
                <div style={s.detailGrid}>
                  {[{ label: 'Name', value: selectedSession.customerName || 'Anonymous' }, { label: 'Phone', value: formatPhone(selectedSession.phone) || 'Not provided' },
                    { label: 'Path', value: getPathLabel(selectedSession.path) }, { label: 'Session ID', value: selectedSession.sessionId, mono: true }].map((item, i) => (
                    <div key={i} style={s.detailItem}><span style={s.detailLabel}>{item.label}</span><span style={{ ...s.detailValue, ...(item.mono ? { fontFamily: 'monospace', fontSize: '12px' } : {}) }}>{item.value}</span></div>
                  ))}
                </div>
              </div>
              {selectedSession.vehicle && (
                <div style={s.detailSection}>
                  <h3 style={s.sectionTitle}>Vehicle Interest</h3>
                  <div style={s.detailGrid}>
                    {[{ label: 'Vehicle', value: `${selectedSession.vehicle.year} ${selectedSession.vehicle.make} ${selectedSession.vehicle.model}` },
                      { label: 'Trim', value: selectedSession.vehicle.trim || 'N/A' }, { label: 'Stock #', value: selectedSession.vehicle.stockNumber },
                      { label: 'Price', value: selectedSession.vehicle.salePrice ? `$${selectedSession.vehicle.salePrice.toLocaleString()}` : 'N/A' }].map((item, i) => (
                      <div key={i} style={s.detailItem}><span style={s.detailLabel}>{item.label}</span><span style={s.detailValue}>{item.value}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSession.tradeIn && (
                <div style={s.detailSection}>
                  <h3 style={s.sectionTitle}>Trade-In</h3>
                  <div style={s.detailGrid}>
                    {[{ label: 'Vehicle', value: `${selectedSession.tradeIn.year} ${selectedSession.tradeIn.make} ${selectedSession.tradeIn.model}` },
                      { label: 'Mileage', value: selectedSession.tradeIn.mileage ? `${selectedSession.tradeIn.mileage.toLocaleString()} mi` : 'N/A' },
                      { label: 'Condition', value: selectedSession.tradeIn.condition || 'N/A' },
                      { label: 'Est. Value', value: selectedSession.tradeIn.estimatedValue ? `$${selectedSession.tradeIn.estimatedValue.toLocaleString()}` : 'N/A', color: '#4ade80' }].map((item, i) => (
                      <div key={i} style={s.detailItem}><span style={s.detailLabel}>{item.label}</span><span style={{ ...s.detailValue, ...(item.color ? { color: item.color } : {}) }}>{item.value}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSession.payment && (
                <div style={s.detailSection}>
                  <h3 style={s.sectionTitle}>Payment Preference</h3>
                  <div style={s.detailGrid}>
                    {[{ label: 'Type', value: selectedSession.payment.type === 'lease' ? 'Lease' : 'Finance' },
                      { label: 'Monthly', value: `$${selectedSession.payment.monthly}/mo` }, { label: 'Term', value: `${selectedSession.payment.term} months` },
                      { label: 'Down Payment', value: `$${selectedSession.payment.downPayment?.toLocaleString() || 0}` }].map((item, i) => (
                      <div key={i} style={s.detailItem}><span style={s.detailLabel}>{item.label}</span><span style={s.detailValue}>{item.value}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSession.chatHistory && selectedSession.chatHistory.length > 0 && (
                <div style={s.detailSection}>
                  <h3 style={s.sectionTitle}>AI Chat History ({selectedSession.chatHistory.length} messages)</h3>
                  <div style={s.chatHistoryContainer}>
                    {selectedSession.chatHistory.map((msg: ChatMessage, idx: number) => (
                      <div key={idx} style={{ ...s.chatMessage, ...(msg.role === 'user' ? s.chatMessageUser : s.chatMessageAssistant) }}>
                        <div style={s.chatMessageHeader}><span style={s.chatRole}>{msg.role === 'user' ? '👤 Customer' : '🤖 AI Assistant'}</span>{msg.timestamp && <span style={s.chatTimestamp}>{formatChatTime(msg.timestamp)}</span>}</div>
                        <div style={s.chatContent}>{msg.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={s.detailSection}>
                <h3 style={s.sectionTitle}>Timeline</h3>
                <div style={s.detailGrid}>
                  {[{ label: 'Started', value: formatDate(selectedSession.createdAt) }, { label: 'Last Activity', value: formatDate(selectedSession.updatedAt) }].map((item, i) => (
                    <div key={i} style={s.detailItem}><span style={s.detailLabel}>{item.label}</span><span style={s.detailValue}>{item.value}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const s: Record<string, CSSProperties> = {
  container: { flex: 1, padding: '24px 40px', overflow: 'auto', background: '#0a0a0a', color: '#fff', minHeight: '100vh' },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px', color: 'rgba(255,255,255,0.6)' },
  spinner: { width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#1B7340', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  errorIcon: { fontSize: '48px' },
  errorText: { color: '#ef4444' },
  retryBtn: { padding: '12px 24px', background: '#1B7340', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '8px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer', marginBottom: '8px' },
  title: { fontSize: '28px', fontWeight: 700, margin: 0 },
  subtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
  clearFilterBtn: { padding: '8px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' },
  statCardActive: { background: 'rgba(27,115,64,0.15)', border: '1px solid rgba(27,115,64,0.4)' },
  statValue: { fontSize: '32px', fontWeight: 700, color: '#fff' },
  statLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '4px' },
  filterIndicator: { padding: '12px 16px', background: 'rgba(27,115,64,0.1)', border: '1px solid rgba(27,115,64,0.2)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', marginBottom: '16px' },
  tableContainer: { background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  tr: { cursor: 'pointer' },
  td: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' },
  timeValue: { fontSize: '13px', color: 'rgba(255,255,255,0.7)' },
  customerCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  customerName: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  customerPhone: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  pathBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 },
  vehicleCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  vehicleName: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  vehicleStock: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  tradeCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  tradeName: { fontSize: '14px', color: '#fff' },
  tradeValue: { fontSize: '12px', color: '#4ade80' },
  emptyCell: { color: 'rgba(255,255,255,0.2)' },
  statusCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusComplete: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: '12px', fontWeight: 600 },
  statusRequested: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '12px', fontWeight: 600 },
  statusBrowsing: { display: 'inline-block', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 },
  chatBadge: { fontSize: '12px', padding: '2px 6px', background: 'rgba(139,92,246,0.2)', borderRadius: '4px', color: '#a78bfa' },
  viewBtn: { padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '90%', maxWidth: '700px', maxHeight: '90vh', background: '#1a1a1a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' },
  modalContent: { padding: '24px', overflow: 'auto' },
  detailSection: { marginBottom: '24px' },
  sectionTitle: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: '0 0 12px 0' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
  detailValue: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  chatHistoryContainer: { maxHeight: '300px', overflow: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px' },
  chatMessage: { marginBottom: '12px', padding: '12px', borderRadius: '8px' },
  chatMessageUser: { background: 'rgba(37,99,235,0.15)', borderLeft: '3px solid #2563eb' },
  chatMessageAssistant: { background: 'rgba(27,115,64,0.15)', borderLeft: '3px solid #1B7340' },
  chatMessageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  chatRole: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  chatTimestamp: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
  chatContent: { fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
};

export default TrafficLog;
