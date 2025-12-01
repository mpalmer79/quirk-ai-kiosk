import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        {!isHome && (
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            ← Back
          </button>
        )}
      </div>

      <div style={styles.logo} onClick={() => navigate('/')}>
        <span style={styles.logoQuirk}>QUIRK</span>
        <span style={styles.logoAI}>AI</span>
      </div>

      <div style={styles.right}>
        <button style={styles.iconButton} onClick={() => navigate('/search')}>
          🔍
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: '#141414',
    borderBottom: '1px solid #2a2a2a',
    minHeight: '72px',
  },
  left: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  right: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoQuirk: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  logoAI: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#1a472a',
    background: '#ffffff',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  iconButton: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
};

export default Header;
