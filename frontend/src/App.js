import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useKiosk } from './context/KioskContext';
import Header from './components/Header';
import Screensaver from './components/Screensaver';
import HomePage from './pages/HomePage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import SearchPage from './pages/SearchPage';

function App() {
  const { isIdle, wakeUp } = useKiosk();

  return (
    <div className="app-container" onClick={wakeUp}>
      {isIdle && <Screensaver onTouch={wakeUp} />}
      
      <Header />
      
      <main className="page-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
