import React, { useState, useCallback, useEffect } from 'react';

// Import all customer journey components (using actual filenames)
import WelcomeScreen from './Welcomescreen';
import StockLookup from './Stocklookup';
import ModelBudgetSelector from './Modelbudgetselector';
import GuidedQuiz from './Guidedquiz';
import InventoryResults from './Inventoryresults';
import VehicleDetail from './Vehicledetail';
import PaymentCalculator from './Paymentcalculator';
import TradeInEstimator from './TradeInestimator';
import CustomerHandoff from './Customerhandoff';
import ErrorBoundary from './Errorboundary';

// Screen-level error boundary with recovery option
const ScreenErrorBoundary = ({ children, onReset, screenName }) => {
  return (
    <ErrorBoundary
      fallback={
        <div style={screenErrorStyles.container}>
          <div style={screenErrorStyles.icon}>⚠️</div>
          <h2 style={screenErrorStyles.title}>This screen encountered an error</h2>
          <p style={screenErrorStyles.text}>
            We had trouble loading {screenName || 'this screen'}. 
            Let's get you back on track.
          </p>
          <div style={screenErrorStyles.buttons}>
            <button style={screenErrorStyles.primaryBtn} onClick={onReset}>
              Return to Start
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

const screenErrorStyles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px',
  },
  text: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '28px',
    maxWidth: '400px',
  },
  buttons: {
    display: 'flex',
    gap: '16px',
  },
  primaryBtn: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

// Main Kiosk Application - Customer Journey Controller
const KioskApp = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [customerData, setCustomerData] = useState({
    customerName: null,
    path: null,
    stockNumber: null,
    selectedModel: null,
    budgetRange: { min: 300, max: 800 },
    downPayment: 3000,
    quizAnswers: {},
    selectedVehicle: null,
    tradeIn: null,
    paymentPreference: null,
    contactInfo: null,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const updateCustomerData = useCallback((updates) => {
    setCustomerData(prev => ({ ...prev, ...updates }));
  }, []);

  const navigateTo = useCallback((screen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
    }, 150);
  }, []);

  const resetJourney = useCallback(() => {
    setCustomerData({
      customerName: null,
      path: null,
      stockNumber: null,
      selectedModel: null,
      budgetRange: { min: 300, max: 800 },
      downPayment: 3000,
      quizAnswers: {},
      selectedVehicle: null,
      tradeIn: null,
      paymentPreference: null,
      contactInfo: null,
    });
    setCurrentScreen('welcome');
  }, []);

  // Idle timeout - return to welcome after 3 minutes of inactivity
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (currentScreen !== 'welcome') {
        timeout = setTimeout(() => {
          resetJourney();
        }, 180000); // 3 minutes
      }
    };

    const events = ['touchstart', 'click', 'mousemove', 'keypress'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentScreen, resetJourney]);

  // Screen components map
  const screens = {
    welcome: WelcomeScreen,
    stockLookup: StockLookup,
    modelBudget: ModelBudgetSelector,
    guidedQuiz: GuidedQuiz,
    inventory: InventoryResults,
    vehicleDetail: VehicleDetail,
    paymentCalculator: PaymentCalculator,
    tradeIn: TradeInEstimator,
    handoff: CustomerHandoff,
  };

  const CurrentScreenComponent = screens[currentScreen] || WelcomeScreen;

  // Props passed to all screen components
  const screenProps = {
    customerData,
    updateCustomerData,
    navigateTo,
    resetJourney,
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo} onClick={resetJourney}>
          <span style={styles.logoText}>QUIRK</span>
          <span style={styles.logoAI}>AI</span>
        </div>
        {currentScreen !== 'welcome' && (
          <button style={styles.backButton} onClick={resetJourney}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Start Over
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{
        ...styles.main,
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
      }}>
        <ScreenErrorBoundary onReset={resetJourney} screenName={currentScreen}>
          <CurrentScreenComponent {...screenProps} />
        </ScreenErrorBoundary>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>Quirk Chevrolet</span>
        <span style={styles.footerDot}>•</span>
        <span>New England's #1 Dealer</span>
        <span style={styles.footerDot}>•</span>
        <span style={styles.footerTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </footer>

      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        input, select, button {
          font-family: inherit;
        }
        
        input:focus, select:focus, button:focus {
          outline: none;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    fontFamily: '"Montserrat", "Segoe UI", sans-serif',
    color: '#ffffff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '2px',
    color: '#ffffff',
  },
  logoAI: {
    fontSize: '20px',
    fontWeight: '700',
    background: '#1B7340',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '6px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
  },
  footerDot: {
    color: '#1B7340',
  },
  footerTime: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
};

export default KioskApp;
