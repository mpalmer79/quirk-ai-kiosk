import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './responsive.css';
import App from './App';

// =============================================================================
// ERROR TRACKING SETUP (Sentry)
// =============================================================================

const initErrorTracking = async () => {
  // Only initialize in production with valid DSN
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.REACT_APP_ENVIRONMENT;
  
  if (environment === 'production' && dsn) {
    try {
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: dsn,
        environment: environment,
        release: process.env.REACT_APP_VERSION || 'unknown',
        
        // Performance monitoring
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
        
        // Sample rates
        tracesSampleRate: 0.1,  // 10% of transactions
        replaysSessionSampleRate: 0.0,  // Disable session replay
        replaysOnErrorSampleRate: 0.1,  // 10% of errors get replay
        
        // Filter out noisy errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
          /Loading chunk \d+ failed/,
        ],
        
        // Sanitize sensitive data
        beforeSend(event) {
          // Remove any phone numbers from error reports
          if (event.message) {
            event.message = event.message.replace(/\d{3}[-.]?\d{3}[-.]?\d{4}/g, '[PHONE]');
          }
          return event;
        },
      });
      
      console.log('Error tracking initialized');
    } catch (error) {
      console.warn('Failed to initialize error tracking:', error);
    }
  }
};

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

const reportWebVitals = async () => {
  if (process.env.REACT_APP_ENABLE_ANALYTICS !== 'true') {
    return;
  }
  
  try {
    const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import('web-vitals');
    
    const sendToAnalytics = (metric) => {
      // Log to console in development
      if (process.env.REACT_APP_ENVIRONMENT === 'development') {
        console.log(`[Web Vital] ${metric.name}:`, metric.value);
        return;
      }
      
      // In production, send to backend analytics endpoint
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
      
      fetch(`${apiUrl}/analytics/web-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating,
          navigationType: metric.navigationType,
          sessionId: sessionStorage.getItem('kiosk_session_id'),
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail - don't break the app for analytics
      });
    };
    
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    // web-vitals not available
  }
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

const initApp = async () => {
  // Initialize error tracking first
  await initErrorTracking();
  
  // Start performance monitoring
  reportWebVitals();
  
  // Log environment info
  console.log(`🚗 Quirk AI Kiosk v${process.env.REACT_APP_VERSION || 'dev'}`);
  console.log(`📍 Environment: ${process.env.REACT_APP_ENVIRONMENT || 'development'}`);
  console.log(`🔗 API: ${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}`);
  
  // Render application
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the app
initApp();
