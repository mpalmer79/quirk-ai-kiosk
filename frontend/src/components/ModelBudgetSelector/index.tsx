import React, { useState, useCallback, useEffect } from 'react';
import styles from '../modelBudgetSelectorStyles';
import ProgressBar from './ProgressBar';
import { useInventoryCounts } from './hooks/useInventoryCounts';
import { 
  CategorySelection, 
  ModelSelection, 
  CabSelection, 
  ColorSelection, 
  BudgetSelection, 
  TradeInSelection 
} from './steps';
import { toSlug } from './constants';
import { initialModelBudgetState } from './types';
import type { ModelBudgetState, ModelBudgetStep } from './types';
import type { KioskComponentProps, AvailableModel } from '../../types';

// Extended props to support sub-route
interface ModelBudgetSelectorProps extends KioskComponentProps {
  subRoute?: string; // e.g., "category", "model/trucks", "cab/silverado-1500"
}

const ModelBudgetSelector: React.FC<ModelBudgetSelectorProps> = ({ 
  navigateTo, 
  updateCustomerData, 
  customerData,
  resetJourney,
  subRoute = 'category',
}) => {
  const { inventoryByModel, vehicleCategories, loading, error } = useInventoryCounts();
  const [state, setState] = useState<ModelBudgetState>(initialModelBudgetState);

  // Parse sub-route to determine current step and params
  const parseSubRoute = useCallback((route: string): { 
    step: ModelBudgetStep; 
    categorySlug?: string;
    modelSlug?: string; 
    cabSlug?: string;
  } => {
    const parts = route.split('/').filter(Boolean);
    const stepName = parts[0] as ModelBudgetStep;
    
    switch (stepName) {
      case 'model':
        return { step: 'model', categorySlug: parts[1] };
      case 'cab':
        return { step: 'cab', modelSlug: parts[1] };
      case 'color':
        return { step: 'color', modelSlug: parts[1], cabSlug: parts[2] };
      case 'budget':
        return { step: 'budget', modelSlug: parts[1], cabSlug: parts[2] };
      case 'trade':
        return { step: 'trade', modelSlug: parts[1], cabSlug: parts[2] };
      case 'category':
      default:
        return { step: 'category' };
    }
  }, []);

  const { step, categorySlug, modelSlug, cabSlug } = parseSubRoute(subRoute);

  // Calculate current step number for progress bar
  const getStepNumber = useCallback((): number => {
    // Check if selected model has cab options
    let modelHasCabs = false;
    if (modelSlug) {
      for (const category of Object.values(vehicleCategories)) {
        const model = category.models.find(m => toSlug(m.name) === modelSlug);
        if (model?.cabOptions && model.cabOptions.length > 0) {
          modelHasCabs = true;
          break;
        }
      }
    }

    switch (step) {
      case 'category': return 1;
      case 'model': return 2;
      case 'cab': return 3;
      case 'color': return modelHasCabs ? 4 : 3;
      case 'budget': return modelHasCabs ? 5 : 4;
      case 'trade': return modelHasCabs ? 6 : 5;
      default: return 1;
    }
  }, [step, modelSlug, vehicleCategories]);

  // Calculate total steps based on whether model has cab options
  const getTotalSteps = useCallback((): number => {
    if (modelSlug) {
      for (const category of Object.values(vehicleCategories)) {
        const model = category.models.find(m => toSlug(m.name) === modelSlug);
        if (model?.cabOptions && model.cabOptions.length > 0) {
          return 6; // With cab selection
        }
      }
    }
    return 5; // Without cab selection
  }, [modelSlug, vehicleCategories]);

  const updateState = useCallback((updates: Partial<ModelBudgetState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle final search/completion
  const handleComplete = useCallback(() => {
    // Find the selected model object
    let selectedModelObj: AvailableModel | null = null;
    if (modelSlug) {
      for (const category of Object.values(vehicleCategories)) {
        const model = category.models.find(m => toSlug(m.name) === modelSlug);
        if (model) {
          selectedModelObj = model;
          break;
        }
      }
    }

    updateCustomerData({
      selectedModel: selectedModelObj?.name,
      selectedCab: cabSlug ? cabSlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') : undefined,
      colorPreferences: [state.colorChoices.first, state.colorChoices.second].filter(Boolean),
      budgetRange: state.budgetRange,
      downPaymentPercent: state.downPaymentPercent,
      hasTrade: state.hasTrade,
      hasPayoff: state.hasPayoff,
      payoffAmount: state.hasPayoff ? parseFloat(state.payoffAmount) : null,
      monthlyPayment: state.hasPayoff ? parseFloat(state.monthlyPayment) : null,
      financedWith: state.hasPayoff ? state.financedWith : null,
      tradeVehicle: state.hasTrade ? {
        year: state.tradeVehicle.year,
        make: state.tradeVehicle.make,
        model: state.tradeVehicle.model,
        mileage: state.tradeVehicle.mileage ? parseInt(state.tradeVehicle.mileage) : null,
      } : null,
      path: 'modelBudget',
    });
    navigateTo('inventory');
  }, [modelSlug, cabSlug, state, vehicleCategories, updateCustomerData, navigateTo]);

  // Shared props for all step components
  const stepProps = {
    state,
    updateState,
    navigateTo,
    inventoryByModel,
    vehicleCategories,
    resetJourney,
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading available models...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Error loading inventory. Please try again.</p>
          {resetJourney && (
            <button style={styles.continueButton} onClick={resetJourney}>
              Return to Start
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render appropriate step
  const renderStep = (): JSX.Element | null => {
    switch (step) {
      case 'category':
        return <CategorySelection {...stepProps} />;
      
      case 'model':
        return categorySlug 
          ? <ModelSelection {...stepProps} categoryKey={categorySlug} />
          : <CategorySelection {...stepProps} />;
      
      case 'cab':
        return modelSlug 
          ? <CabSelection {...stepProps} modelSlug={modelSlug} />
          : <CategorySelection {...stepProps} />;
      
      case 'color':
        return modelSlug 
          ? <ColorSelection {...stepProps} modelSlug={modelSlug} cabSlug={cabSlug} />
          : <CategorySelection {...stepProps} />;
      
      case 'budget':
        return modelSlug 
          ? <BudgetSelection {...stepProps} modelSlug={modelSlug} cabSlug={cabSlug} />
          : <CategorySelection {...stepProps} />;
      
      case 'trade':
        return modelSlug 
          ? <TradeInSelection {...stepProps} modelSlug={modelSlug} cabSlug={cabSlug} onComplete={handleComplete} />
          : <CategorySelection {...stepProps} />;
      
      default:
        return <CategorySelection {...stepProps} />;
    }
  };

  return (
    <div style={styles.container}>
      {renderStep()}
      <ProgressBar currentStep={getStepNumber()} totalSteps={getTotalSteps()} />
    </div>
  );
};

export default ModelBudgetSelector;

// Re-export types and constants for external use
export * from './types';
export * from './constants';
