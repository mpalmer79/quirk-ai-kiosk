import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

const WelcomeScreen = ({ navigateTo, updateCustomerData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await inventoryAPI.getStats();
      setStats(response.data);
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
    updateCustomerData({ path: 'browse' });
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
      {/* Background Effects */}
      <div style={styles.backgroundGlow} />
      
      {/* Hero Section */}
      <div style={{
        ...styles.heroSection,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}>
        <div style={styles.greeting}>
          <div style={styles.aiAvatar}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <path d="M9 9h.01M15 9h.01"/>
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
              background: hoveredPath === path.id ? path.gradient : 'rgba(255,255,255,0.05)',
              borderColor: hoveredPath === path.id ? 'transparent' : 'rgba(255,255,255,0.1)',
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

      {/* Stats Bar - Dynamic from API */}
      <div style={{
        ...styles.statsBar,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s ease 0.4s',
      }}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats?.total || '---'}</span>
          <span style={styles.statLabel}>Vehicles In Stock</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats?.byBodyStyle?.SUV || '---'}</span>
          <span style={styles.statLabel}>SUVs</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats?.byBodyStyle?.Truck || '---'}</span>
          <span style={styles.statLabel}>Trucks</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {stats?.priceRange?.min ? `$${Math.round(stats.priceRange.min / 1000)}K` : '---'}
          </span>
          <span style={styles.statLabel}>Starting At</span>
        </div>
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
  backgroundGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(27,115,64,0.15) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroSection: {
    textAlign: 'center',
    marginBottom: '48px',
    transition: 'all 0.6s ease',
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
  },
  heroText: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
  },
  pathsContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '40px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '1200px',
  },
  pathCard: {
    flex: '1 1 320px',
    maxWidth: '380px',
    minHeight: '280px',
    padding: '32px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
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
    gap: '32px',
    padding: '24px 48px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
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
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '12px 24px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
};

export default WelcomeScreen;
