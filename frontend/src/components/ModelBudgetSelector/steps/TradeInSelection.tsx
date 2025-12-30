import React, { useState, useEffect, ChangeEvent } from 'react';
import api from '../../api';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps, TradeVehicleInfo } from '../types';
import type { AvailableModel } from '../../../types';
import { YEAR_OPTIONS, COMMON_MAKES, toSlug } from '../constants';

interface TradeInSelectionProps extends StepProps {
  modelSlug: string;
  cabSlug?: string;
  onComplete: () => void;
}

const TradeInSelection: React.FC<TradeInSelectionProps> = ({ 
  state,
  updateState,
  navigateTo, 
  vehicleCategories,
  modelSlug,
  cabSlug,
  onComplete,
}) => {
  const [hasTrade, setHasTrade] = useState<boolean | null>(state.hasTrade);
  const [hasPayoff, setHasPayoff] = useState<boolean | null>(state.hasPayoff);
  const [payoffAmount, setPayoffAmount] = useState<string>(state.payoffAmount);
  const [monthlyPayment, setMonthlyPayment] = useState<string>(state.monthlyPayment);
  const [financedWith, setFinancedWith] = useState<string>(state.financedWith);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [tradeVehicle, setTradeVehicle] = useState<TradeVehicleInfo>(state.tradeVehicle);
  const [tradeModels, setTradeModels] = useState<string[]>([]);
  const [loadingTradeModels, setLoadingTradeModels] = useState<boolean>(false);
  
  // Find the model across all categories
  let foundModel: AvailableModel | null = null;
  
  for (const category of Object.values(vehicleCategories)) {
    const model = category.models.find(m => toSlug(m.name) === modelSlug);
    if (model) {
      foundModel = model;
      break;
    }
  }

  // If model not found, redirect
  if (!foundModel) {
    setTimeout(() => navigateTo('modelBudget/category'), 0);
    return null;
  }

  // Sync with parent state
  useEffect(() => {
    updateState({ 
      selectedModel: foundModel,
      selectedCab: cabSlug ? cabSlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') : null,
    });
  }, [foundModel, cabSlug, updateState]);

  // Fetch trade-in models when year and make are selected
  useEffect(() => {
    const fetchTradeModels = async () => {
      if (tradeVehicle.year && tradeVehicle.make) {
        setLoadingTradeModels(true);
        try {
          const models = await api.getModels(tradeVehicle.make, tradeVehicle.year);
          setTradeModels(models || []);
        } catch (err) {
          console.error('Error fetching trade models:', err);
          setTradeModels([]);
        } finally {
          setLoadingTradeModels(false);
        }
      } else {
        setTradeModels([]);
      }
    };
    fetchTradeModels();
  }, [tradeVehicle.year, tradeVehicle.make]);

  // Currency input handlers
  const handlePayoffAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setPayoffAmount(rawValue);
  };

  const handlePayoffBlur = (): void => {
    setFocusedField(null);
    if (payoffAmount) {
      const num = parseFloat(payoffAmount);
      if (!isNaN(num)) {
        setPayoffAmount(num.toFixed(2));
      }
    }
  };

  const handleMonthlyPaymentChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setMonthlyPayment(rawValue);
  };

  const handleMonthlyPaymentBlur = (): void => {
    setFocusedField(null);
    if (monthlyPayment) {
      const num = parseFloat(monthlyPayment);
      if (!isNaN(num)) {
        setMonthlyPayment(num.toFixed(2));
      }
    }
  };

  const getDisplayValue = (field: string, rawValue: string): string => {
    if (!rawValue) return '';
    if (focusedField === field) return rawValue;
    const num = parseFloat(rawValue);
    if (isNaN(num)) return rawValue;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleFinancedWithChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.slice(0, 25);
    setFinancedWith(value);
  };

  const handleTradeVehicleChange = (field: keyof TradeVehicleInfo, value: string): void => {
    const newTradeVehicle = { ...tradeVehicle, [field]: value };
    if (field === 'year' || field === 'make') {
      newTradeVehicle.model = ''; // Reset model when year/make changes
    }
    setTradeVehicle(newTradeVehicle);
  };

  const handleSearch = (): void => {
    updateState({
      hasTrade,
      hasPayoff,
      payoffAmount,
      monthlyPayment,
      financedWith,
      tradeVehicle,
    });
    onComplete();
  };

  const handleBack = (): void => {
    const basePath = cabSlug 
      ? `modelBudget/budget/${modelSlug}/${cabSlug}`
      : `modelBudget/budget/${modelSlug}`;
    navigateTo(basePath);
  };

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backButton} onClick={handleBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <div style={styles.stepHeader}>
        <h1 style={styles.stepTitle}>🚗 Trade-In Vehicle</h1>
        <p style={styles.stepSubtitle}>Do you have a vehicle to trade in?</p>
      </div>
      <div style={styles.formSection}>
        <div style={styles.tradeOptions}>
          <button
            style={{...styles.tradeCard, ...(hasTrade === true ? styles.tradeCardActive : {})}}
            onClick={() => setHasTrade(true)}
          >
            <div style={styles.tradeIcon}>✓</div>
            <span style={styles.tradeName}>Yes, I have a trade-in</span>
            <span style={styles.tradeDesc}>Get an instant estimate on your current vehicle</span>
          </button>
          <button
            style={{...styles.tradeCard, ...(hasTrade === false ? styles.tradeCardActive : {})}}
            onClick={() => { setHasTrade(false); setHasPayoff(null); }}
          >
            <div style={styles.tradeIcon}>✗</div>
            <span style={styles.tradeName}>No trade-in</span>
            <span style={styles.tradeDesc}>I don't have a vehicle to trade</span>
          </button>
        </div>

        {hasTrade === true && (
          <div style={styles.payoffSection}>
            {/* Trade Vehicle Information */}
            <h3 style={styles.payoffTitle}>Tell us about your trade-in vehicle</h3>
            <div style={styles.tradeVehicleGrid}>
              <div style={styles.payoffFieldGroup}>
                <label style={styles.inputLabel}>Year</label>
                <select
                  style={styles.selectInput}
                  value={tradeVehicle.year}
                  onChange={(e) => handleTradeVehicleChange('year', e.target.value)}
                >
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div style={styles.payoffFieldGroup}>
                <label style={styles.inputLabel}>Make</label>
                <select
                  style={styles.selectInput}
                  value={tradeVehicle.make}
                  onChange={(e) => handleTradeVehicleChange('make', e.target.value)}
                >
                  <option value="">Select Make</option>
                  {COMMON_MAKES.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              <div style={styles.payoffFieldGroup}>
                <label style={styles.inputLabel}>Model</label>
                <select
                  style={styles.selectInput}
                  value={tradeVehicle.model}
                  onChange={(e) => handleTradeVehicleChange('model', e.target.value)}
                  disabled={!tradeVehicle.year || !tradeVehicle.make || loadingTradeModels}
                >
                  <option value="">{loadingTradeModels ? 'Loading...' : 'Select Model'}</option>
                  {tradeModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              <div style={styles.payoffFieldGroup}>
                <label style={styles.inputLabel}>Mileage</label>
                <input
                  type="text"
                  style={styles.textInputStandalone}
                  placeholder="e.g., 45000"
                  value={tradeVehicle.mileage}
                  onChange={(e) => handleTradeVehicleChange('mileage', e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            {/* Loan Payoff Question */}
            <h3 style={{...styles.payoffTitle, marginTop: '24px'}}>Does your trade-in have a loan payoff?</h3>
            <div style={styles.payoffOptions}>
              <button
                style={{...styles.optionButton, ...(hasPayoff === true ? styles.optionButtonActive : {})}}
                onClick={() => setHasPayoff(true)}
              >
                Yes
              </button>
              <button
                style={{...styles.optionButton, ...(hasPayoff === false ? styles.optionButtonActive : {})}}
                onClick={() => setHasPayoff(false)}
              >
                No / Paid Off
              </button>
            </div>

            {hasPayoff === true && (
              <div style={styles.payoffFieldsGrid}>
                <div style={styles.payoffFieldGroup}>
                  <label style={styles.inputLabel}>Approximate Payoff Amount</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputPrefix}>$</span>
                    <input
                      type="text"
                      style={styles.textInput}
                      placeholder="18,000.00"
                      value={getDisplayValue('payoff', payoffAmount)}
                      onChange={handlePayoffAmountChange}
                      onFocus={() => setFocusedField('payoff')}
                      onBlur={handlePayoffBlur}
                    />
                  </div>
                </div>
                
                <div style={styles.payoffFieldGroup}>
                  <label style={styles.inputLabel}>Monthly Payment</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputPrefix}>$</span>
                    <input
                      type="text"
                      style={styles.textInput}
                      placeholder="450.00"
                      value={getDisplayValue('monthly', monthlyPayment)}
                      onChange={handleMonthlyPaymentChange}
                      onFocus={() => setFocusedField('monthly')}
                      onBlur={handleMonthlyPaymentBlur}
                    />
                  </div>
                </div>
                
                <div style={styles.payoffFieldGroup}>
                  <label style={styles.inputLabel}>Financed With</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type="text"
                      style={styles.textInputFull}
                      placeholder="Bank or lender name"
                      value={financedWith}
                      onChange={handleFinancedWithChange}
                      maxLength={25}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          style={{...styles.searchButton, opacity: (hasTrade !== null) ? 1 : 0.5}}
          onClick={handleSearch}
          disabled={hasTrade === null}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          Find My {foundModel.name}
        </button>
      </div>
    </div>
  );
};

export default TradeInSelection;
