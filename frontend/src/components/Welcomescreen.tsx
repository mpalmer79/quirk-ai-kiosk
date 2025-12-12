import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, CSSProperties } from 'react';
import api from './api';
import type { KioskComponentProps } from '../types';

interface InventoryStats { total?: number; byBodyStyle?: { SUV?: number; Truck?: number; [key: string]: number | undefined; }; priceRange?: { min?: number; max?: number; }; }
type PathId = 'stockLookup' | 'modelBudget' | 'aiAssistant';
type StatType = 'total' | 'suv' | 'truck' | 'price' | null;

const PATHS: Array<{ id: PathId; title: string; subtitle: string; description: string; gradient: string; iconPath: string }> = [
  { id: 'stockLookup', title: 'I Have a Stock Number', subtitle: 'Find the exact vehicle', description: 'Enter your stock number to view availability, pricing, and schedule a test drive.', gradient: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', iconPath: 'M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M21 21l-4.35-4.35M11 8v6M8 11h6' },
  { id: 'modelBudget', title: 'I Know What I Want', subtitle: 'Browse by model & budget', description: 'Select your preferred model and set your budget to see matching vehicles in stock.', gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', iconPath: 'M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5' },
  { id: 'aiAssistant', title: 'Chat with Quirk AI', subtitle: "LET'S HAVE A CONVERSATION", description: "Let's walk through this together and find the right vehicle that fits what you're looking for.", gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', iconPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
];

const WelcomeScreen: React.FC<KioskComponentProps> = ({ navigateTo, updateCustomerData, customerData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<StatType>(null);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [customerName, setCustomerName] = useState(customerData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(customerData?.phone || '');
  const [nameSubmitted, setNameSubmitted] = useState(!!customerData?.customerName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 10);
    if (d.length === 0) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  useEffect(() => {
    setIsVisible(true);
    api.getInventoryStats().then(data => setStats(data as InventoryStats)).catch(() => {});
    if (!nameSubmitted) setTimeout(() => nameInputRef.current?.focus(), 800);
  }, [nameSubmitted]);

  const logSession = async (name: string | null, phone: string | null, path?: string) => {
    try {
      await api.logTrafficSession({ customerName: name || undefined, phone: phone || undefined, path: path || 'welcome', currentStep: 'name_entered', actions: name ? ['entered_name'] : ['skipped_name'] });
    } catch {}
  };

  const handleNameSubmit = async () => {
    const trimmedName = customerName.trim();
    const phoneDigits = customerPhone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.length === 10 ? customerPhone : null;
    if (trimmedName) {
      const formattedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();
      updateCustomerData({ customerName: formattedName, phone: formattedPhone || undefined });
      setCustomerName(formattedName);
      await logSession(formattedName, formattedPhone);
    } else if (formattedPhone) {
      updateCustomerData({ phone: formattedPhone });
      await logSession(null, formattedPhone);
    }
    setNameSubmitted(true);
  };

  const handleSkipName = async () => { await logSession(null, null); setNameSubmitted(true); };

  const handlePathSelect = async (path: PathId) => {
    updateCustomerData({ path });
    try { await api.logTrafficSession({ customerName: customerName || undefined, phone: customerPhone || undefined, path, currentStep: path, actions: [`selected_${path}`] }); } catch {}
    navigateTo(path);
  };

  const handleBrowseAll = async () => {
    updateCustomerData({ path: 'browse' });
    try { await api.logTrafficSession({ customerName: customerName || undefined, phone: customerPhone || undefined, path: 'browse', currentStep: 'inventory', actions: ['browse_all'] }); } catch {}
    navigateTo('inventory');
  };

  // Updated: Navigate to filtered inventory based on which stat was clicked
  const handleStatClick = (statKey: StatType) => {
    updateCustomerData({ path: 'browse' });
    
    // Navigate with filter based on stat type
    switch (statKey) {
      case 'suv':
        updateCustomerData({ bodyStyleFilter: 'SUV' });
        navigateTo('inventory', { bodyStyle: 'SUV' });
        break;
      case 'truck':
        updateCustomerData({ bodyStyleFilter: 'Truck' });
        navigateTo('inventory', { bodyStyle: 'Truck' });
        break;
      case 'total':
      case 'price':
      default:
        navigateTo('inventory');
        break;
    }
  };

  const AvatarIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="#fff" stroke="none"/><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/>
    </svg>
  );

  // Phase 1: Name Capture
  if (!nameSubmitted) {
    return (
      <div style={s.container}>
        <div style={s.bgImage} /><div style={s.bgOverlay} />
        <div style={{ ...s.nameCaptureSection, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={s.titleRow}>
            <div style={s.inlineAvatar}><AvatarIcon /></div>
            <h1 style={s.nameTitle}>Hi, I'm your <span style={s.highlight}>Quirk AI</span> assistant</h1>
          </div>
          <h2 style={s.nameSubtitle}>Welcome to Quirk Chevrolet!</h2>
          <p style={s.namePrompt}>What's your first name?</p>
          <div style={s.inputContainer}>
            <input ref={nameInputRef} type="text" style={s.nameInput} placeholder="Enter your first name" value={customerName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
              onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleNameSubmit()} maxLength={20} autoComplete="off" autoCapitalize="words" />
          </div>
          <p style={s.phonePrompt}>Enter Phone Number</p>
          <div style={s.inputContainer}>
            <input type="tel" style={s.phoneInput} placeholder="(Optional) This saves your progress" value={customerPhone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerPhone(formatPhoneNumber(e.target.value))} maxLength={14} autoComplete="off" />
          </div>
          <div style={s.nameActions}>
            <button style={{ ...s.continueBtn, opacity: customerName.trim() ? 1 : 0.5 }} onClick={handleNameSubmit} disabled={!customerName.trim()}>Continue</button>
            <button style={s.skipBtn} onClick={handleSkipName}>Skip for now</button>
          </div>
          <p style={s.privacyNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your name is only used to personalize your experience today
          </p>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
      </div>
    );
  }

  // Phase 2: Path Selection
  return (
    <div style={s.container}>
      <div style={s.bgImage} /><div style={s.bgOverlay} />
      <div style={{ ...s.heroSection, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
        <div style={s.greeting}>
          <div style={s.aiAvatar}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="#fff" stroke="none"/><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/></svg></div>
          <h1 style={s.heroTitle}>{customerName ? <>Nice to meet you, <span style={s.highlight}>{customerName}</span>!</> : <>Hi, I'm your <span style={s.highlight}>Quirk AI</span> assistant</>}</h1>
        </div>
        <h2 style={s.heroSubtitle}>How can I help you today?</h2>
        <p style={s.heroText}>Choose an option below to get started</p>
      </div>

      <div style={s.pathsContainer}>
        {PATHS.map((path) => (
          <div key={path.id} style={{ ...s.pathCard, background: hoveredPath === path.id ? path.gradient : 'rgba(0,0,0,0.6)', transform: hoveredPath === path.id ? 'scale(1.02) translateY(-4px)' : 'scale(1)', borderColor: hoveredPath === path.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}
            onMouseEnter={() => setHoveredPath(path.id)} onMouseLeave={() => setHoveredPath(null)} onClick={() => handlePathSelect(path.id)}>
            <div style={{ ...s.pathIcon, background: hoveredPath === path.id ? 'rgba(255,255,255,0.2)' : path.gradient }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={path.iconPath}/></svg>
            </div>
            <h3 style={s.pathTitle}>{path.title}</h3>
            <p style={s.pathSubtitle}>{path.subtitle}</p>
            <p style={s.pathDescription}>{path.description}</p>
            <div style={{ ...s.pathArrow, transform: hoveredPath === path.id ? 'translateX(4px)' : 'translateX(0)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div style={s.statsBar}>
          {[{ key: 'total' as StatType, value: stats.total || 0, label: 'Vehicles In Stock' },
            { key: 'suv' as StatType, value: stats.byBodyStyle?.SUV || 0, label: 'SUVs' },
            { key: 'truck' as StatType, value: stats.byBodyStyle?.Truck || 0, label: 'Trucks' },
            { key: 'price' as StatType, value: `$${stats.priceRange?.min ? Math.round(stats.priceRange.min / 1000) : 0}k+`, label: 'Starting At' }
          ].map((stat, i) => (
            <React.Fragment key={stat.key}>
              {i > 0 && <div style={s.statDivider} />}
              <button style={{ ...s.statBtn, ...(hoveredStat === stat.key ? s.statBtnHover : {}) }}
                onMouseEnter={() => setHoveredStat(stat.key)} onMouseLeave={() => setHoveredStat(null)} onClick={() => handleStatClick(stat.key)}>
                <div style={s.statItem}><span style={s.statNumber}>{stat.value}</span><span style={s.statLabel}>{stat.label}</span></div>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <button style={s.browseLink} onClick={handleBrowseAll}>Or browse all inventory →</button>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </div>
  );
};

const s: Record<string, CSSProperties> = {
  container: { minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 20px 100px 20px', position: 'relative', fontFamily: "'Montserrat', sans-serif", boxSizing: 'border-box' },
  bgImage: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("/showroom.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 },
  bgOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)', zIndex: 1 },
  nameCaptureSection: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '700px', width: '100%', padding: '20px 40px', transition: 'all 0.6s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px', whiteSpace: 'nowrap' },
  inlineAvatar: { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(27,115,64,0.4)' },
  nameTitle: { fontSize: '32px', fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' },
  nameSubtitle: { fontSize: '26px', fontWeight: 600, color: '#fff', margin: '0 0 28px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  namePrompt: { fontSize: '18px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' },
  phonePrompt: { fontSize: '18px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' },
  inputContainer: { position: 'relative', width: '100%', maxWidth: '420px', marginBottom: '20px' },
  nameInput: { width: '100%', padding: '18px 24px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px', color: '#fff', fontSize: '20px', fontWeight: 600, textAlign: 'center', backdropFilter: 'blur(10px)', boxSizing: 'border-box' },
  phoneInput: { width: '100%', padding: '18px 24px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px', color: '#fff', fontSize: '18px', fontWeight: 500, textAlign: 'center', backdropFilter: 'blur(10px)', boxSizing: 'border-box' },
  nameActions: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', width: '100%', maxWidth: '420px' },
  continueBtn: { width: '100%', padding: '18px 32px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(27,115,64,0.3)' },
  skipBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '10px' },
  privacyNote: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 },
  heroSection: { textAlign: 'center', marginBottom: '48px', transition: 'all 0.6s ease', position: 'relative', zIndex: 2 },
  greeting: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' },
  aiAvatar: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  heroTitle: { fontSize: '28px', fontWeight: 600, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  highlight: { color: '#4ade80' },
  heroSubtitle: { fontSize: '48px', fontWeight: 800, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-1px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  heroText: { fontSize: '20px', color: 'rgba(255,255,255,0.9)', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.5)' },
  pathsContainer: { display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1200px', position: 'relative', zIndex: 2 },
  pathCard: { flex: '1 1 320px', maxWidth: '380px', minHeight: '280px', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' },
  pathIcon: { width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '20px', transition: 'all 0.3s ease' },
  pathTitle: { fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' },
  pathSubtitle: { fontSize: '14px', fontWeight: 600, color: '#4ade80', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' },
  pathDescription: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5, flex: 1 },
  pathArrow: { marginTop: '20px', color: 'rgba(255,255,255,0.5)', transition: 'transform 0.3s ease' },
  statsBar: { display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', position: 'relative', zIndex: 2 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  statBtn: { background: 'transparent', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' },
  statBtnHover: { background: 'rgba(74,222,128,0.15)', transform: 'scale(1.05)' },
  statNumber: { fontSize: '32px', fontWeight: 700, color: '#4ade80' },
  statLabel: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' },
  statDivider: { width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' },
  browseLink: { background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '12px 24px', borderRadius: '8px', position: 'relative', zIndex: 2, backdropFilter: 'blur(5px)' },
};

export default WelcomeScreen;
