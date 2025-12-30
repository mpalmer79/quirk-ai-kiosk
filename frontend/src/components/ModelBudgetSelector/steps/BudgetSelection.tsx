import React, { useState, useEffect, ChangeEvent } from 'react';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps } from '../types';
import type { AvailableModel, BudgetRange } from '../../../types';
import { toSlug } from '../constants';

interface BudgetSelectionProps extends StepProps {
  modelSlug: string;
  cabSlug?: string;
}

const BudgetSelection: React.FC<BudgetSelectionProps> = ({ 
  state,
  updateState,
  navigateTo, 
  vehicleCategories,
  modelSlug,
  cabSlug,
}) => {
  const [budgetRange, setBudgetRange] = useState<BudgetRange>(state.budgetRange);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(state.downPaymentPercent);
  
  // Find the model across all categories
  let foundModel: AvailableModel | null = null;
  
  for (const category of Object.values(vehicleCategories)) {
    const model = category.models.find(m => toSlug(m.name) === modelSlug);
    if (model) {
      foundModel = model;
      break;
    }
  }

  // MOVED: useEffect MUST be called before any early returns
  // Sync with parent state
  useEffect(() => {
    if (foundModel) {
      updateState({ 
        selectedModel: foundModel,
        selectedCab: cabSlug ? cabSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') : null,
      });
    }
  }, [foundModel, cabSlug, updateState]);

  // If model not found, redirect (AFTER all hooks)
  if (!foundModel) {
    setTimeout(() => navigateTo('modelBudget/category'), 0);
    return null;
  }

  // Calculate buying power
  const APR = 0.07;
  const monthlyRate = APR / 12;
  
  const calculateLoanAmount = (payment: number, months: number): number => {
    if (monthlyRate === 0) return payment * months;
    return payment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
  };
  
  const estimatedLoan = calculateLoanAmount(budgetRange.max, 84);
  const term = estimatedLoan > 20000 ? 84 : 72;
  const loanAmount = calculateLoanAmount(budgetRange.max, term);
  
  const downPaymentFraction = downPaymentPercent / 100;
  const totalBuyingPower = downPaymentPercent === 0 
    ? loanAmount 
    : loanAmount / (1 - downPaymentFraction);
  const downPaymentAmount = totalBuyingPower * downPaymentFraction;

  const handleBudgetChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newMax = parseInt(e.target.value);
    const newRange = { ...budgetRange, max: newMax };
    setBudgetRange(newRange);
    updateState({ budgetRange: newRange });
  };

  const handleDownPaymentChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newPercent = parseInt(e.target.value);
    setDownPaymentPercent(newPercent);
    updateState({ downPaymentPercent: newPercent });
  };

  const handleContinue = (): void => {
    updateState({ budgetRange, downPaymentPercent });
    const basePath = cabSlug 
      ? `modelBudget/trade/${modelSlug}/${cabSlug}`
      : `modelBudget/trade/${modelSlug}`;
    navigateTo(basePath);
  };

  const handleBack = (): void => {
    const basePath = cabSlug 
      ? `modelBudget/color/${modelSlug}/${cabSlug}`
      : `modelBudget/color/${modelSlug}`;
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
        <h1 style={styles.stepTitle}>💰 Set Your Budget</h1>
        <p style={styles.stepSubtitle}>Slide to adjust your monthly payment range</p>
      </div>
      <div style={styles.formSection}>
        {/* Monthly Payment Slider */}
        <div style={styles.sliderSection}>
          <div style={styles.sliderHeader}>
            <span style={styles.sliderLabel}>Monthly Payment Target</span>
            <span style={styles.sliderValue}>${budgetRange.max}/mo</span>
          </div>
          <input
            type="range"
            min="300"
            max="2000"
            step="25"
            value={budgetRange.max}
            onChange={handleBudgetChange}
            style={styles.slider}
          />
          <div style={styles.sliderRange}>
            <span>$300</span>
            <span>$2,000</span>
          </div>
        </div>

        {/* Down Payment Slider */}
        <div style={styles.sliderSection}>
          <div style={styles.sliderHeader}>
            <span style={styles.sliderLabel}>Down Payment</span>
            <span style={styles.sliderValue}>{downPaymentPercent}% (${downPaymentAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })})</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={downPaymentPercent}
            onChange={handleDownPaymentChange}
            style={styles.slider}
          />
          <div style={styles.sliderRange}>
            <span>0%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Buying Power Summary */}
        <div style={styles.budgetSummary}>
          <div style={styles.summaryRow}>
            <span>Estimated Term</span>
            <span style={styles.summaryValue}>{term} months</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Estimated APR</span>
            <span style={styles.summaryValue}>{(APR * 100).toFixed(1)}%</span>
          </div>
          <div style={{...styles.summaryRow, ...styles.summaryTotal}}>
            <span>Your Buying Power</span>
            <span style={styles.summaryTotalValue}>
              ${totalBuyingPower.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <button style={styles.continueButton} onClick={handleContinue}>
          Continue to Trade-In
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BudgetSelection;
