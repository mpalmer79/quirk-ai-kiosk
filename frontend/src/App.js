import React from 'react';
import KioskApp from './components/Kioskapp';
import ErrorBoundary from './components/Errorboundary';

function App() {
  return (
    <ErrorBoundary>
      <KioskApp />
    </ErrorBoundary>
  );
}

export default App;
