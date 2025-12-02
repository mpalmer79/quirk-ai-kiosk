import React, { useState, useCallback } from 'react';

// Main Kiosk Application - Customer Journey Controller
const KioskApp = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [customerData, setCustomerData] = useState({
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

  const updateCustomerData = useCallback((updates) => {
    setCustomerData(prev => ({ ...prev, ...updates }));
  }, []);

  const navigateTo = useCallback((screen) => {
    setCurrentScreen(screen);
  }, []);

  const resetJourney = useCallback(() => {
    setCustomerData({
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
  React.useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (currentScreen !== 'welcome') {
        timeout = setTimeout(() => {
          resetJourney();
        }, 180000); // 3 minutes
      }
    };

    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [currentScreen, resetJourney]);

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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Start Over
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        {renderScreen(currentScreen, {
          customerData,
          updateCustomerData,
          navigateTo,
          resetJourney,
        })}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>Quirk Chevrolet</span>
        <span style={styles.footerDot}>•</span>
        <span>New England's #1 Dealer</span>
      </footer>
    </div>
  );
};

// Screen Router
const renderScreen = (screen, props) => {
  // These will be imported from separate files in production
  // For now, returning placeholder - components defined in separate files
  const screens = {
    welcome: <WelcomeScreen {...props} />,
    stockLookup: <StockLookup {...props} />,
    modelBudget: <ModelBudgetSelector {...props} />,
    guidedQuiz: <GuidedQuiz {...props} />,
    inventory: <InventoryResults {...props} />,
    vehicleDetail: <VehicleDetail {...props} />,
    paymentCalculator: <PaymentCalculator {...props} />,
    tradeIn: <TradeInEstimator {...props} />,
    handoff: <CustomerHandoff {...props} />,
  };
  
  return screens[screen] || screens.welcome;
};

// Placeholder components - will be replaced with imports
const WelcomeScreen = ({ navigateTo, updateCustomerData }) => (
  <div>Welcome Screen - See WelcomeScreen.js</div>
);
const StockLookup = (props) => <div>Stock Lookup - See StockLookup.js</div>;
const ModelBudgetSelector = (props) => <div>Model Budget - See ModelBudgetSelector.js</div>;
const GuidedQuiz = (props) => <div>Guided Quiz - See GuidedQuiz.js</div>;
const InventoryResults = (props) => <div>Inventory Results - See InventoryResults.js</div>;
const VehicleDetail = (props) => <div>Vehicle Detail - See VehicleDetail.js</div>;
const PaymentCalculator = (props) => <div>Payment Calculator - See PaymentCalculator.js</div>;
const TradeInEstimator = (props) => <div>Trade-In - See TradeInEstimator.js</div>;
const CustomerHandoff = (props) => <div>Customer Handoff - See CustomerHandoff.js</div>;

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
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
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
};

export default KioskApp;
