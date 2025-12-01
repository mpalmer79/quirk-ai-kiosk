import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const KioskContext = createContext();

const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export function KioskProvider({ children }) {
  const [isIdle, setIsIdle] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [viewedVehicles, setViewedVehicles] = useState([]);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Reset idle timer on activity
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Wake up from screensaver
  const wakeUp = useCallback(() => {
    if (isIdle) {
      setIsIdle(false);
      setSessionId(`session-${Date.now()}`);
      setViewedVehicles([]);
    }
    resetTimer();
  }, [isIdle, resetTimer]);

  // Track vehicle view
  const trackVehicleView = useCallback((vehicleId) => {
    setViewedVehicles((prev) => {
      if (!prev.includes(vehicleId)) {
        return [...prev, vehicleId];
      }
      return prev;
    });
    resetTimer();
  }, [resetTimer]);

  // Check for idle timeout
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (!isIdle && Date.now() - lastActivity > IDLE_TIMEOUT) {
        setIsIdle(true);
        setSessionId(null);
        setViewedVehicles([]);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [isIdle, lastActivity]);

  // Track user activity
  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'mousemove', 'keydown', 'scroll'];
    
    const handleActivity = () => {
      if (!isIdle) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isIdle, resetTimer]);

  const value = {
    isIdle,
    sessionId,
    viewedVehicles,
    wakeUp,
    trackVehicleView,
    resetTimer,
  };

  return (
    <KioskContext.Provider value={value}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
}
