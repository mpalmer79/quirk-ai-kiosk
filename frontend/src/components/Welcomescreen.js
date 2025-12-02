import React, { useState, useEffect } from 'react';
import api from './api';

const WelcomeScreen = ({ navigateTo, updateCustomerData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getInventoryStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handlePathSelect = (path) => {
    updateCustomerData({ path });
    const routes = {
      stockLookup: 'stockLookup',
      modelBudget: 'modelBudget',
      guidedQuiz: 'guidedQuiz',
    };
    navigateTo(routes[path]);
  };

  const handleBrowseAll = () => {
    updateCustomerData({ path: 'browse', filterType: null, sortBy: null });
    navigateTo('inventory');
  };

  // Handle stat clicks - each navigates to inventory with different filters
  const handleStatClick = (statType) => {
    switch (statType) {
      case 'total':
        // Show all vehicles
        updateCustomerData({ path: 'browse', filterType: null, sortBy: null });
        break;
      case 'suv':
        // Filter to SUVs only
        updateCustomerData({ path: 'browse', filterType: 'SUV', bodyStyleFilter: 'SUV' });
        break;
      case 'truck':
        // Filter to Trucks only
        updateCustomerData({ path: 'browse', filterType: 'Truck', bodyStyleFilter: 'Truck' });
        break;
      case 'price':
        // Show all sorted by price ascending
        updateCustomerData({ path: 'browse', filterType: null, sortBy: 'priceLow' });
        break;
      default:
        updateCustomerData({ path: 'browse' });
    }
    navigateTo('inventory');
  };

  const paths = [
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
            {/* Fixed Smiley Face - proper eyes and smile */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              {/* Face circle */}
              <circle cx="12" cy="12" r="10" />
              {/* Left eye - filled circle */}
              <circle cx="9" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              {/* Right eye - filled circle */}
              <circle cx="15" cy="10" r="1.5" fill="#ffffff" stroke="none" />
              {/* Smile */}
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={styles.heroTitle}>
            Hi, I'm your <span style={styles.highlight}>Quirk AI</span> assistant
          </h1>
        </div>
        
        <h2 style={styles.heroSubtitle}>
          Welcome to Quirk Chevrolet
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

const styles = {
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
    WebkitBackdropFilter: 'blur(10px)',
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
    WebkitBackdropFilter: 'blur(10px)',
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
    WebkitBackdropFilter: 'blur(5px)',
  },
};

export default WelcomeScreen;
