/**
 * Digital Worksheet Component
 * Interactive deal structuring interface for the kiosk.
 * Allows customers to view and adjust payment options in real-time.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './DigitalWorksheet.css';

// =============================================================================
// TYPES
// =============================================================================

interface TermOption {
  term_months: number;
  apr: number;
  monthly_payment: number;
  total_of_payments: number;
  total_interest: number;
  is_selected: boolean;
}

interface VehicleInfo {
  stock_number: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  exterior_color?: string;
  vin?: string;
  msrp: number;
}

interface TradeInInfo {
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  estimated_value?: number;
  appraised_value?: number;
  payoff_amount?: number;
  equity: number;
  appraisal_status: string;
}

interface Worksheet {
  id: string;
  session_id: string;
  status: string;
  vehicle: VehicleInfo;
  has_trade: boolean;
  trade_in?: TradeInInfo;
  selling_price: number;
  trade_equity: number;
  down_payment: number;
  amount_financed: number;
  term_options: TermOption[];
  selected_term?: number;
  total_due_at_signing: number;
  monthly_payment: number;
  doc_fee: number;
  title_fee: number;
  manager_adjustment?: number;
  manager_notes?: string;
  counter_offer_sent?: boolean;
}

interface DigitalWorksheetProps {
  worksheetId: string;
  sessionId: string;
  onReady?: (worksheetId: string) => void;
  onClose?: () => void;
  apiBaseUrl?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 'https://quirk-backend-production.up.railway.app';

// =============================================================================
// COMPONENT
// =============================================================================

const DigitalWorksheet: React.FC<DigitalWorksheetProps> = ({
  worksheetId,
  sessionId,
  onReady,
  onClose,
  apiBaseUrl = DEFAULT_API_URL,
}) => {
  // State
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downPayment, setDownPayment] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // =============================================================================
  // API CALLS
  // =============================================================================

  const fetchWorksheet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/worksheet/${worksheetId}`, {
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load worksheet');
      }

      const data = await response.json();
      if (data.success && data.worksheet) {
        setWorksheet(data.worksheet);
        setDownPayment(data.worksheet.down_payment);
        setSelectedTerm(data.worksheet.selected_term || 72);
      } else {
        throw new Error(data.message || 'Failed to load worksheet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [worksheetId, sessionId, apiBaseUrl]);

  const updateWorksheet = useCallback(async (updates: {
    down_payment?: number;
    selected_term?: number;
  }) => {
    if (!worksheet) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`${apiBaseUrl}/worksheet/${worksheetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update worksheet');
      }

      const data = await response.json();
      if (data.success && data.worksheet) {
        setWorksheet(data.worksheet);
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [worksheet, worksheetId, sessionId, apiBaseUrl]);

  const markReady = useCallback(async () => {
    if (!worksheet) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`${apiBaseUrl}/worksheet/${worksheetId}/ready`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to notify sales team');
      }

      const data = await response.json();
      if (data.success) {
        setIsReady(true);
        setShowConfirmation(true);
        if (onReady) {
          onReady(worksheetId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to notify sales team');
    } finally {
      setIsUpdating(false);
    }
  }, [worksheet, worksheetId, sessionId, apiBaseUrl, onReady]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchWorksheet();
  }, [fetchWorksheet]);

  // Debounce down payment updates
  useEffect(() => {
    if (!worksheet || downPayment === worksheet.down_payment) return;

    const timer = setTimeout(() => {
      updateWorksheet({ down_payment: downPayment });
    }, 500);

    return () => clearTimeout(timer);
  }, [downPayment, worksheet, updateWorksheet]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleDownPaymentChange = (value: number) => {
    // Clamp between 0 and selling price
    const maxDown = worksheet?.selling_price || 100000;
    const clamped = Math.max(0, Math.min(value, maxDown));
    setDownPayment(clamped);
  };

  const handleTermSelect = (termMonths: number) => {
    setSelectedTerm(termMonths);
    updateWorksheet({ selected_term: termMonths });
  };

  const handleDownPaymentSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDownPaymentChange(parseInt(e.target.value, 10));
  };

  const handleDownPaymentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    handleDownPaymentChange(parseInt(value, 10) || 0);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedTermOption = (): TermOption | null => {
    if (!worksheet) return null;
    return worksheet.term_options.find(t => t.term_months === selectedTerm) || null;
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (loading) {
    return (
      <div className="worksheet-container worksheet-loading">
        <div className="loading-spinner"></div>
        <p>Loading your worksheet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="worksheet-container worksheet-error">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchWorksheet} className="btn-retry">
          Try Again
        </button>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="worksheet-container worksheet-error">
        <p>Worksheet not found</p>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="worksheet-container worksheet-confirmation">
        <div className="confirmation-content">
          <div className="confirmation-icon">✅</div>
          <h2>You're All Set!</h2>
          <p>A sales manager has been notified and will be with you shortly.</p>
          <div className="confirmation-summary">
            <div className="summary-item">
              <span className="label">Vehicle</span>
              <span className="value">
                {worksheet.vehicle.year} {worksheet.vehicle.model} {worksheet.vehicle.trim}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Monthly Payment</span>
              <span className="value highlight">
                {formatCurrency(getSelectedTermOption()?.monthly_payment || worksheet.monthly_payment)}/mo
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Due at Signing</span>
              <span className="value">{formatCurrency(worksheet.total_due_at_signing)}</span>
            </div>
          </div>
          <p className="confirmation-note">
            Feel free to continue browsing while you wait!
          </p>
          {onClose && (
            <button onClick={onClose} className="btn-continue">
              Continue Browsing
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedOption = getSelectedTermOption();

  return (
    <div className="worksheet-container">
      {/* Header */}
      <div className="worksheet-header">
        <h2>Digital Worksheet</h2>
        <p className="worksheet-subtitle">
          Adjust the numbers below to find the perfect payment for you
        </p>
        {onClose && (
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      {/* Vehicle Info */}
      <div className="worksheet-section vehicle-section">
        <div className="vehicle-info">
          <h3>
            {worksheet.vehicle.year} {worksheet.vehicle.make} {worksheet.vehicle.model}
            {worksheet.vehicle.trim && ` ${worksheet.vehicle.trim}`}
          </h3>
          <p className="vehicle-details">
            Stock #{worksheet.vehicle.stock_number}
            {worksheet.vehicle.exterior_color && ` • ${worksheet.vehicle.exterior_color}`}
          </p>
        </div>
        <div className="vehicle-price">
          <span className="price-label">Selling Price</span>
          <span className="price-value">
            {formatCurrency(worksheet.selling_price)}
            {worksheet.manager_adjustment && worksheet.manager_adjustment < 0 && (
              <span className="price-discount">
                Save {formatCurrency(Math.abs(worksheet.manager_adjustment))}!
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Trade-In Section */}
      {worksheet.has_trade && worksheet.trade_in && (
        <div className="worksheet-section trade-section">
          <h4>Your Trade-In</h4>
          <div className="trade-info">
            <span className="trade-vehicle">
              {worksheet.trade_in.year} {worksheet.trade_in.make} {worksheet.trade_in.model}
            </span>
            <div className="trade-equity">
              <span className="equity-label">Estimated Equity</span>
              <span className={`equity-value ${worksheet.trade_equity >= 0 ? 'positive' : 'negative'}`}>
                {worksheet.trade_equity >= 0 ? '+' : ''}{formatCurrency(worksheet.trade_equity)}
              </span>
            </div>
          </div>
          {worksheet.trade_in.appraisal_status !== 'appraised' && (
            <p className="trade-note">
              * Final trade value pending professional appraisal
            </p>
          )}
        </div>
      )}

      {/* Down Payment Adjuster */}
      <div className="worksheet-section downpayment-section">
        <h4>Down Payment</h4>
        <div className="downpayment-controls">
          <div className="downpayment-input-group">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              value={downPayment.toLocaleString()}
              onChange={handleDownPaymentInput}
              className="downpayment-input"
              aria-label="Down payment amount"
            />
          </div>
          <input
            type="range"
            min="0"
            max={Math.min(worksheet.selling_price, 100000)}
            step="500"
            value={downPayment}
            onChange={handleDownPaymentSlider}
            className="downpayment-slider"
            aria-label="Adjust down payment"
          />
          <div className="slider-labels">
            <span>$0</span>
            <span>{formatCurrency(Math.min(worksheet.selling_price, 100000))}</span>
          </div>
        </div>
      </div>

      {/* Term Options */}
      <div className="worksheet-section terms-section">
        <h4>Select Your Term</h4>
        <div className="term-options">
          {worksheet.term_options.map((option) => (
            <button
              key={option.term_months}
              className={`term-option ${selectedTerm === option.term_months ? 'selected' : ''}`}
              onClick={() => handleTermSelect(option.term_months)}
              disabled={isUpdating}
            >
              <span className="term-months">{option.term_months} mo</span>
              <span className="term-payment">{formatCurrency(option.monthly_payment)}</span>
              <span className="term-apr">{option.apr}% APR</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="worksheet-section summary-section">
        <div className="payment-summary">
          <div className="summary-row">
            <span>Vehicle Price</span>
            <span>{formatCurrency(worksheet.selling_price)}</span>
          </div>
          {worksheet.trade_equity !== 0 && (
            <div className="summary-row">
              <span>Trade-In Equity</span>
              <span className={worksheet.trade_equity >= 0 ? 'positive' : 'negative'}>
                {worksheet.trade_equity >= 0 ? '-' : '+'}{formatCurrency(Math.abs(worksheet.trade_equity))}
              </span>
            </div>
          )}
          <div className="summary-row">
            <span>Down Payment</span>
            <span>-{formatCurrency(downPayment)}</span>
          </div>
          <div className="summary-row total">
            <span>Amount Financed</span>
            <span>{formatCurrency(worksheet.amount_financed)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row">
            <span>Doc Fee</span>
            <span>{formatCurrency(worksheet.doc_fee)}</span>
          </div>
          <div className="summary-row">
            <span>Title Fee</span>
            <span>{formatCurrency(worksheet.title_fee)}</span>
          </div>
          <div className="summary-row highlight">
            <span>Due at Signing</span>
            <span>{formatCurrency(worksheet.total_due_at_signing)}</span>
          </div>
        </div>

        {/* Monthly Payment Highlight */}
        <div className="monthly-highlight">
          <span className="monthly-label">Your Monthly Payment</span>
          <span className="monthly-amount">
            {formatCurrency(selectedOption?.monthly_payment || worksheet.monthly_payment)}
            <span className="per-month">/mo</span>
          </span>
          {selectedOption && (
            <span className="monthly-details">
              for {selectedOption.term_months} months @ {selectedOption.apr}% APR
            </span>
          )}
        </div>

        <p className="tax-disclosure">
          💡 New Hampshire has no sales tax on vehicles! Other states may add tax to your payment.
        </p>
      </div>

      {/* Counter Offer Banner */}
      {worksheet.counter_offer_sent && worksheet.manager_notes && (
        <div className="counter-offer-banner">
          <span className="counter-icon">💬</span>
          <div className="counter-content">
            <strong>Message from Sales Manager:</strong>
            <p>{worksheet.manager_notes}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="worksheet-actions">
        <button
          className="btn-ready"
          onClick={markReady}
          disabled={isUpdating || isReady}
        >
          {isUpdating ? 'Please wait...' : isReady ? 'Manager Notified!' : "I'm Ready - Get a Manager"}
        </button>
        <p className="action-note">
          A sales manager will come to finalize the details with you
        </p>
      </div>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="updating-overlay">
          <div className="updating-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default DigitalWorksheet;
