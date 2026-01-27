/**
 * Styles barrel export
 * Import all styles from this single file
 */
import type { CSSProperties } from 'react';

export { default as theme } from './theme';
export * from './theme';

// Common component styles - used by Placeholder, Header, and other components
export const styles: Record<string, CSSProperties> = {
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    minHeight: '200px',
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  placeholderTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  placeholderText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid #D1AD57',
  },
  headerIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0077b6 0%, #005a8c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,119,182,0.3)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#D1AD57',
    margin: '4px 0 0 0',
    fontWeight: 600,
  },
  audioToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    color: '#333',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f5f5f5',
  },
  audioLabel: {
    fontSize: '13px',
    color: '#333',
  },
  questionsToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    color: '#333',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f5f5f5',
  },
};
