import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, CSSProperties } from 'react';
import api from './api';
import type { CustomerData, KioskComponentProps } from '../types';

// Stats interface from API
interface InventoryStats {
  total?: number;
  byBodyStyle?: {
    SUV?: number;
    Truck?: number;
    Sedan?: number;
    [key: string]: number | undefined;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
}

// Path configuration
interface PathConfig {
  id: 'stockLookup' | 'modelBudget' | 'guidedQuiz' | 'aiAssistant';
  icon: JSX.Element;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
}

type StatType = 'total' | 'suv' | 'truck' | 'price' | null;

const WelcomeScreen: React.FC<KioskComponentProps> = ({ navigateTo, updateCustomerData, customerData }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<StatType>(null);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  
  // Name capture state
  const [customerName, setCustomerName] = useState<string>(customerData?.customerName || '');
  const [nameSubmitted, setNameSubmitted] = useState<boolean>(!!customerData?.customerName);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsVisible(true);
    loadStats();
    
    // Focus name input after animation
    if (!nameSubmitted) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 800);
    }
  }, [nameSubmitted]);

  const loadStats = async (): Promise<void> => {
    try {
      const data = await api.getInventoryStats() as InventoryStats;
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleNameSubmit = (): void => {
    const trimmedName = customerName.trim();
    if (trimmedName) {
      // Capitalize first letter
      const formattedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();
      updateCustomerData({ customerName: formattedName });
      setCustomerName(formattedName);
    }
    setNameSubmitted(true);
  };

  const handleNameKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
  };

  const handleSkipName = (): void => {
    setNameSubmitted(true);
  };

  const handlePathSelect = (path: string): void => {
    updateCustomerData({ path });
    const routes: Record<string, string> = {
      stockLookup: 'stockLookup',
      modelBudget: 'modelBudget',
      guidedQuiz: 'guidedQuiz',
      aiAssistant: 'aiAssistant',
    };
    navigateTo(routes[path]);
  };

  const handleBrowseAll = (): void => {
    updateCustomerData({ path: 'browse' });
    navigateTo('inventory');
  };

  // Handle stat clicks - each navigates to inventory with different filters
  const handleStatClick = (statType: StatType): void => {
    switch (statType) {
      case 'total':
        updateCustomerData({ path: 'browse' });
        break;
      case 'suv':
        updateCustomerData({ path: 'browse' });
        break;
      case 'truck':
        updateCustomerData({ path: 'browse' });
        break;
      case 'price':
        updateCustomerData({ path: 'browse' });
        break;
      default:
        updateCustomerData({ path: 'browse' });
    }
    navigateTo('inventory');
  };

  const paths: PathConfig[] = [
    {
      id: 'stockLookup',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M11 8v6M8 11h6"/>
        </svg>
      ),
      title: 'I Have a Stock Number',
      subtitle: 'Find the exact vehicle',
      description: 'Enter your stock number to view availability, pricing, and schedule a test drive.',
      gradient: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    },
    {
      id: 'modelBudget',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/>
        </svg>
      ),
      title: 'I Know What I Want',
      subtitle: 'Browse by model & budget',
      description: 'Select your preferred model and set your budget to see matching vehicles in stock.',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    },
    {
      id: 'aiAssistant',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="10" r="1" fill="currentColor"/>
          <circle cx="8" cy="10" r="1" fill="currentColor"/>
          <circle cx="16" cy="10" r="1" fill="currentColor"/>
        </svg>
      ),
      title: 'Chat with AI',
      subtitle: 'Natural language search',
      description: 'Tell me what you need in plain English and I\'ll find the perfect vehicle for you.',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    },
    {
      id: 'guidedQuiz',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
      ),
      title: 'Help Me Decide',
      subtitle: 'Take our 10-question quiz',
      description: 'Answer a few questions and we\'ll recommend the perfect vehicle for your lifestyle.',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    },
  ];

  // Get personalized greeting
  const getGreeting = (): JSX.Element => {
    if (customerName) {
      return (
        <>
          Nice to meet you, <span style={styles.highlight}>{customerName}</span>!
        </>
      );
    }
    return (
      <>
        Hi, I'm your <span style={styles.highlight}>Quirk AI</span> assistant
      </>
    );
  };

  // Phase 1: Name Capture Screen
  if (!nameSubmitted) {
    return (
      <div style={styles.container}>
        {/* Background Image */}
        <div style={styles.backgroundImage} />
        <div style={styles.backgroundOverlay} />
        
        {/* Name Capture Section */}
        <div style={{
          ...styles.nameCaptureSection,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        }}>
          {/* AI Avatar */}
          <div style={styles.largeAiAvatar}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="9" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              <circle cx="15" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
            </svg>
          </div>

          <h1 style={styles.nameTitle}>
            Hi, I'm your <span style={styles.highlight}>Quirk AI</span> assistant
          </h1>
          
          <h2 style={styles.nameSubtitle}>
            Welcome to Quirk Chevrolet!
          </h2>
          
          <p style={styles.namePrompt}>
            What's your first name?
          </p>

          {/* Name Input */}
          <div style={styles.nameInputContainer}>
            <input
              ref={nameInputRef}
              type="text"
              style={styles.nameInput}
              placeholder="Enter your first name"
              value={customerName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCustomerName(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyPress={handleNameKeyPress}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="words"
            />
            
            {isTyping && (
              <button 
                style={styles.nameSubmitButton}
                onClick={handleNameSubmit}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>

          {/* Continue / Skip */}
          <div style={styles.nameActions}>
            <button 
              style={{
                ...styles.continueButton,
                opacity: customerName.trim() ? 1 : 0.5,
              }}
              onClick={handleNameSubmit}
              disabled={!customerName.trim()}
            >
              Continue
            </button>
            
            <button 
              style={styles.skipButton}
              onClick={handleSkipName}
            >
              Skip for now
            </button>
          </div>

          {/* Privacy Note */}
          <p style={styles.privacyNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Your name is only used to personalize your experience today
          </p>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        `}</style>
      </div>
    );
  }

  // Phase 2: Main Welcome Screen with Personalization
  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={styles.backgroundImage} />
      <div style={styles.backgroundOverlay} />
      
      {/* Hero Section */}
      <div style={{
        ...styles.heroSection,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}>
        <div style={styles.greeting}>
          <div style={styles.aiAvatar}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="9" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              <circle cx="15" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={styles.heroTitle}>
            {getGreeting()}
          </h1>
        </div>
        
        <h2 style={styles.heroSubtitle}>
          {customerName ? 'Welcome to Quirk Chevrolet' : 'Welcome to Quirk Chevrolet'}
        </h2>
        
        <p style={styles.heroText}>
          How can I help you find your perfect vehicle today?
        </p>
      </div>

      {/* Path Selection Cards */}
      <div style={{
        ...styles.pathsContainer,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease 0.2s',
      }}>
        {paths.map((path, index) => (
          <button
            key={path.id}
            style={{
              ...styles.pathCard,
              background: hoveredPath === path.id ? path.gradient : 'rgba(0,0,0,0.7)',
              borderColor: hoveredPath === path.id ? 'transparent' : 'rgba(255,255,255,0.2)',
              transform: hoveredPath === path.id ? 'scale(1.02) translateY(-4px)' : 'scale(1)',
              transitionDelay: `${index * 0.1}s`,
            }}
            onMouseEnter={() => setHoveredPath(path.id)}
            onMouseLeave={() => setHoveredPath(null)}
            onClick={() => handlePathSelect(path.id)}
          >
            <div style={{
              ...styles.pathIcon,
              background: hoveredPath === path.id ? 'rgba(255,255,255,0.2)' : path.gradient,
            }}>
              {path.icon}
            </div>
            
            <h3 style={styles.pathTitle}>{path.title}</h3>
            <p style={styles.pathSubtitle}>{path.subtitle}</p>
            <p style={styles.pathDescription}>{path.description}</p>
            
            <div style={styles.pathArrow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Bar - Clickable Stats */}
      <div style={{
        ...styles.statsBar,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s ease 0.4s',
      }}>
        {/* Total Vehicles */}
        <button 
          style={{
            ...styles.statItem,
            ...styles.statButton,
            ...(hoveredStat === 'total' ? styles.statButtonHover : {}),
          }}
          onMouseEnter={() => setHoveredStat('total')}
          onMouseLeave={() => setHoveredStat(null)}
          onClick={() => handleStatClick('total')}
        >
          <span style={styles.statNumber}>{stats?.total || '---'}</span>
          <span style={styles.statLabel}>Vehicles In Stock</span>
        </button>

        <div style={styles.statDivider} />

        {/* SUVs */}
        <button 
          style={{
            ...styles.statItem,
            ...styles.statButton,
            ...(hoveredStat === 'suv' ? styles.statButtonHover : {}),
          }}
          onMouseEnter={() => setHoveredStat('suv')}
          onMouseLeave={() => setHoveredStat(null)}
          onClick={() => handleStatClick('suv')}
        >
          <span style={styles.statNumber}>{stats?.byBodyStyle?.SUV || '---'}</span>
          <span style={styles.statLabel}>SUVs</span>
        </button>

        <div style={styles.statDivider} />

        {/* Trucks */}
        <button 
          style={{
            ...styles.statItem,
            ...styles.statButton,
            ...(hoveredStat === 'truck' ? styles.statButtonHover : {}),
          }}
          onMouseEnter={() => setHoveredStat('truck')}
          onMouseLeave={() => setHoveredStat(null)}
          onClick={() => handleStatClick('truck')}
        >
          <span style={styles.statNumber}>{stats?.byBodyStyle?.Truck || '---'}</span>
          <span style={styles.statLabel}>Trucks</span>
        </button>

        <div style={styles.statDivider} />

        {/* Starting Price */}
        <button 
          style={{
            ...styles.statItem,
            ...styles.statButton,
            ...(hoveredStat === 'price' ? styles.statButtonHover : {}),
          }}
          onMouseEnter={() => setHoveredStat('price')}
          onMouseLeave={() => setHoveredStat(null)}
          onClick={() => handleStatClick('price')}
        >
          <span style={styles.statNumber}>
            {stats?.priceRange?.min ? `$${Math.round(stats.priceRange.min / 1000)}K` : '---'}
          </span>
          <span style={styles.statLabel}>Starting At</span>
        </button>
      </div>

      {/* Just Browsing Link */}
      <button
        style={{
          ...styles.browseLink,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.6s ease 0.5s',
        }}
        onClick={handleBrowseAll}
      >
        Just browsing? View all {stats?.total || ''} vehicles →
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url(/showroom.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.85) 100%)',
    zIndex: 1,
  },
  // Name Capture Styles
  nameCaptureSection: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '40px',
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.6s ease',
  },
  largeAiAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    margin: '0 auto 24px',
    boxShadow: '0 8px 32px rgba(27, 115, 64, 0.4)',
  },
  nameTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  nameSubtitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    margin: '0 0 32px 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  namePrompt: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.8)',
    margin: '0 0 20px 0',
  },
  nameInputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: '24px',
  },
  nameInput: {
    width: '100%',
    padding: '20px 60px 20px 24px',
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    boxSizing: 'border-box',
  },
  nameSubmitButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  nameActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  continueButton: {
    width: '100%',
    padding: '18px 32px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(27, 115, 64, 0.3)',
  },
  skipButton: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '12px',
    transition: 'color 0.2s ease',
  },
  privacyNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  // Main Welcome Styles
  heroSection: {
    textAlign: 'center',
    marginBottom: '48px',
    transition: 'all 0.6s ease',
    position: 'relative',
    zIndex: 2,
  },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  aiAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  highlight: {
    color: '#4ade80',
  },
  heroSubtitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 16px 0',
    letterSpacing: '-1px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  heroText: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.9)',
    margin: 0,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  pathsContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '40px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '1200px',
    position: 'relative',
    zIndex: 2,
  },
  pathCard: {
    flex: '1 1 320px',
    maxWidth: '380px',
    minHeight: '280px',
    padding: '32px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  pathIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
  },
  pathTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  pathSubtitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4ade80',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  pathDescription: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    margin: '0',
    lineHeight: '1.5',
    flex: 1,
  },
  pathArrow: {
    marginTop: '20px',
    color: 'rgba(255,255,255,0.5)',
    transition: 'transform 0.3s ease',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 24px',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '24px',
    position: 'relative',
    zIndex: 2,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statButton: {
    background: 'transparent',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statButtonHover: {
    background: 'rgba(74, 222, 128, 0.15)',
    transform: 'scale(1.05)',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#4ade80',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: 'rgba(255,255,255,0.1)',
  },
  browseLink: {
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '12px 24px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    position: 'relative',
    zIndex: 2,
    backdropFilter: 'blur(5px)',
  },
};

export default WelcomeScreen;
