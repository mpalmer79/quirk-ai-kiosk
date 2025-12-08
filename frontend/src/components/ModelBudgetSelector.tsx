import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import api, { logTrafficSession } from './api';
import GM_COLORS from '../types/gmColors';
import { BASE_CATEGORIES, modelMatches } from '../types/vehicleCategories';
import styles from './modelBudgetSelectorStyles';
import { getModelsForMake, TRADE_IN_MAKES } from './tradeInVehicles';
import type { 
  BudgetRange, 
  Vehicle, 
  VehicleCategories, 
  AvailableModel,
  GMColor,
  KioskComponentProps
} from '../types';

// Color choices state interface
interface ColorChoices {
  first: string;
  second: string;
}

// Trade-in vehicle info
interface TradeVehicleInfo {
  year: string;
  make: string;
  model: string;
  mileage: string;
}

// Inventory count by model name
type InventoryByModel = Record<string, number>;

// Currency formatter for payoff fields - formats on blur only
const formatCurrency = (value: string): string => {
  if (!value) return '';
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Generate year options (current year + 1 down to 20 years ago)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => (currentYear + 1 - i).toString());

const ModelBudgetSelector: React.FC<KioskComponentProps> = ({ 
  navigateTo, 
  updateCustomerData, 
  customerData,
  resetJourney 
}) => {
  // Steps: 1=Category, 2=Model, 3=Cab, 4=Colors, 5=Budget, 6=Trade-In
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(null);
  const [selectedCab, setSelectedCab] = useState<string | null>(null);
  const [colorChoices, setColorChoices] = useState<ColorChoices>({ first: '', second: '' });
  const [budgetRange, setBudgetRange] = useState<BudgetRange>({ min: 400, max: 900 });
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(10);
  const [hasTrade, setHasTrade] = useState<boolean | null>(null);
  const [hasPayoff, setHasPayoff] = useState<boolean | null>(null);
  const [payoffAmount, setPayoffAmount] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<string>('');
  const [financedWith, setFinancedWith] = useState<string>('');
  const [payoffFocused, setPayoffFocused] = useState<boolean>(false);
  const [monthlyFocused, setMonthlyFocused] = useState<boolean>(false);
  const [tradeVehicle, setTradeVehicle] = useState<TradeVehicleInfo>({
    year: '',
    make: '',
    model: '',
    mileage: '',
  });
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [inventoryByModel, setInventoryByModel] = useState<InventoryByModel>({});
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);
  // Trade-in model dropdown state
  const [tradeModels, setTradeModels] = useState<string[]>([]);

  // Ref to track if we've already saved (prevent duplicate saves)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build trade-in data object for API
  const buildTradeInData = useCallback(() => {
    if (hasTrade === null) return undefined;
    
    return {
      hasTrade,
      vehicle: hasTrade ? {
        year: tradeVehicle.year ? parseInt(tradeVehicle.year) : null,
        make: tradeVehicle.make || null,
        model: tradeVehicle.model || null,
        mileage: tradeVehicle.mileage ? parseInt(tradeVehicle.mileage) : null,
      } : null,
      hasPayoff: hasTrade ? hasPayoff : null,
      payoffAmount: hasPayoff ? parseFloat(payoffAmount) || null : null,
      monthlyPayment: hasPayoff ? parseFloat(monthlyPayment) || null : null,
      financedWith: hasPayoff ? financedWith || null : null,
    };
  }, [hasTrade, hasPayoff, tradeVehicle, payoffAmount, monthlyPayment, financedWith]);

  // Save trade-in data to backend (debounced)
  const saveTradeInData = useCallback(async () => {
    const tradeInData = buildTradeInData();
    if (!tradeInData) return;

    try {
      await logTrafficSession({
        currentStep: 'trade-in',
        tradeIn: tradeInData,
      });
      console.log('Trade-in data saved:', tradeInData);
    } catch (err) {
      console.warn('Failed to save trade-in data:', err);
    }
  }, [buildTradeInData]);

  // Debounced save - waits 500ms after last change before saving
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTradeInData();
    }, 500);
  }, [saveTradeInData]);

  // Auto-save trade-in data whenever it changes
  useEffect(() => {
    if (step === 6 && hasTrade !== null) {
      debouncedSave();
    }
  }, [step, hasTrade, hasPayoff, tradeVehicle, payoffAmount, monthlyPayment, financedWith, debouncedSave]);

  // Save immediately when leaving page (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear debounce and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const tradeInData = buildTradeInData();
      if (tradeInData && hasTrade !== null) {
        // Use sendBeacon for reliable save on page close
        const data = JSON.stringify({
          currentStep: 'trade-in',
          tradeIn: tradeInData,
        });
        navigator.sendBeacon?.('/api/v1/traffic/session', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTradeInData();
    };
  }, [buildTradeInData, hasTrade, saveTradeInData]);

  // Fetch inventory counts on mount to filter available models
  useEffect(() => {
    const loadInventoryCounts = async (): Promise<void> => {
      try {
        const data = await api.getInventory({});
        const vehicles: Vehicle[] = Array.isArray(data) ? data : (data as { vehicles?: Vehicle[] }).vehicles || [];
        
        const counts: InventoryByModel = {};
        vehicles.forEach((vehicle: Vehicle) => {
          const model = (vehicle.model || '').trim();
          if (model) {
            Object.values(BASE_CATEGORIES).forEach(category => {
              category.modelNames.forEach((categoryModel: string) => {
                if (modelMatches(model, categoryModel)) {
                  counts[categoryModel] = (counts[categoryModel] || 0) + 1;
                }
              });
            });
          }
        });
        
        setInventoryByModel(counts);
      } catch (err) {
        console.error('Error loading inventory counts:', err);
      } finally {
        setLoadingInventory(false);
      }
    };
    
    loadInventoryCounts();
  }, []);

  // Get trade-in models from local database when make is selected
  useEffect(() => {
    if (tradeVehicle.make) {
      setTradeModels(getModelsForMake(tradeVehicle.make));
    } else {
      setTradeModels([]);
    }
    // Reset model when make changes
    setTradeVehicle(prev => ({ ...prev, model: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeVehicle.make]);

  // Build dynamic categories based on actual inventory
  const VEHICLE_CATEGORIES: VehicleCategories = Object.entries(BASE_CATEGORIES).reduce(
    (acc: VehicleCategories, [key, category]) => {
      const availableModels: AvailableModel[] = category.modelNames
        .filter((modelName: string) => (inventoryByModel[modelName] || 0) > 0)
        .map((modelName: string) => ({
          name: modelName,
          count: inventoryByModel[modelName] || 0,
          cabOptions: category.cabOptions?.[modelName],
        }));
      
      if (availableModels.length > 0) {
        acc[key] = {
          name: category.name,
          icon: category.icon,
          models: availableModels,
        };
      }
      
      return acc;
    }, 
    {} as VehicleCategories
  );

  const getModelColors = (): GMColor[] => {
    if (!selectedModel) return [];
    return GM_COLORS[selectedModel.name] || GM_COLORS['Equinox'];
  };

  useEffect(() => {
    if (selectedModel) {
      setInventoryCount(inventoryByModel[selectedModel.name] || 0);
    }
  }, [selectedModel, inventoryByModel]);

  const handleCategorySelect = (categoryKey: string): void => {
    setSelectedCategory(categoryKey);
    setSelectedModel(null);
    setSelectedCab(null);
    setStep(2);
  };

  const handleModelSelect = (model: AvailableModel): void => {
    setSelectedModel(model);
    setStep(model.cabOptions ? 3 : 4);
  };

  const handleCabSelect = (cab: string): void => {
    setSelectedCab(cab);
    setStep(4);
  };

  const handleColorChange = (choice: keyof ColorChoices, value: string): void => {
    setColorChoices(prev => ({ ...prev, [choice]: value }));
  };

  // Allow typing freely, only strip non-numeric except decimal
  const handlePayoffAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setPayoffAmount(rawValue);
  };

  const handlePayoffBlur = (): void => {
    setPayoffFocused(false);
    if (payoffAmount) {
      const num = parseFloat(payoffAmount);
      if (!isNaN(num)) {
        setPayoffAmount(num.toFixed(2));
      }
    }
  };

  // Allow typing freely, only strip non-numeric except decimal
  const handleMonthlyPaymentChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setMonthlyPayment(rawValue);
  };

  const handleMonthlyBlur = (): void => {
    setMonthlyFocused(false);
    if (monthlyPayment) {
      const num = parseFloat(monthlyPayment);
      if (!isNaN(num)) {
        setMonthlyPayment(num.toFixed(2));
      }
    }
  };

  const handleFinancedWithChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.slice(0, 25);
    setFinancedWith(value);
  };

  const handleTradeVehicleChange = (field: keyof TradeVehicleInfo, value: string): void => {
    setTradeVehicle(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = (): void => {
    updateCustomerData({
      selectedModel: selectedModel?.name,
      selectedCab: selectedCab || undefined,
      colorPreferences: [colorChoices.first, colorChoices.second].filter(Boolean),
      budgetRange,
      downPaymentPercent,
      hasTrade,
      hasPayoff,
      payoffAmount: hasPayoff ? parseFloat(payoffAmount) : null,
      monthlyPayment: hasPayoff ? parseFloat(monthlyPayment) : null,
      financedWith: hasPayoff ? financedWith : null,
      tradeVehicle: hasTrade ? {
        year: tradeVehicle.year,
        make: tradeVehicle.make,
        model: tradeVehicle.model,
        mileage: tradeVehicle.mileage ? parseInt(tradeVehicle.mileage) : null,
      } : null,
      path: 'modelBudget',
    });
    navigateTo('inventory');
  };

  const handleBack = (): void => {
    if (step === 6) setStep(5);
    else if (step === 5) setStep(4);
    else if (step === 4 && selectedModel?.cabOptions) setStep(3);
    else if (step === 4) setStep(2);
    else if (step === 3) setStep(2);
    else if (step === 2) { setStep(1); setSelectedCategory(null); }
  };

  // Loading state
  if (loadingInventory) {
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

  // Step 1: Category Selection
  const renderCategorySelection = (): JSX.Element => (
    <div style={styles.stepContainer}>
      <div style={styles.stepHeader}>
        <div style={styles.stepIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6"/>
          </svg>
        </div>
        <h1 style={styles.stepTitle}>What type of vehicle are you looking for?</h1>
        <p style={styles.stepSubtitle}>Select a category to get started</p>
      </div>
      <div style={styles.categoryGrid}>
        {Object.entries(VEHICLE_CATEGORIES).map(([key, category]) => (
          <button key={key} style={styles.categoryCard} onClick={() => handleCategorySelect(key)}>
            <span style={styles.categoryIcon}>{category.icon}</span>
            <span style={styles.categoryName}>{category.name}</span>
            <span style={styles.categoryCount}>{category.models.length} models</span>
          </button>
        ))}
      </div>
      
      {resetJourney && (
        <div style={styles.startOverContainer}>
          <button style={styles.startOverButton} onClick={resetJourney}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Start Over
          </button>
        </div>
      )}
    </div>
  );

  // Step 2: Model Selection
  const renderModelSelection = (): JSX.Element | null => {
    const category = selectedCategory ? VEHICLE_CATEGORIES[selectedCategory] : null;
    if (!category) {
      setStep(1);
      return null;
    }
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <span style={styles.categoryBadge}>{category.icon} {category.name}</span>
          <h1 style={styles.stepTitle}>Which model interests you?</h1>
          <p style={styles.stepSubtitle}>Select a model to see available options</p>
        </div>
        <div style={styles.modelGrid}>
          {category.models.map((model) => (
            <button key={model.name} style={styles.modelCard} onClick={() => handleModelSelect(model)}>
              <div style={styles.modelInitial}>{model.name.charAt(0)}</div>
              <span style={styles.modelName}>{model.name}</span>
              <span style={styles.modelCount}>{model.count} in stock</span>
              {model.cabOptions && <span style={styles.modelConfig}>{model.cabOptions.length} configurations</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 3: Cab Selection
  const renderCabSelection = (): JSX.Element | null => {
    if (!selectedModel?.cabOptions) return null;
    
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <span style={styles.modelBadge}>{selectedModel.name}</span>
          <h1 style={styles.stepTitle}>What cab configuration?</h1>
          <p style={styles.stepSubtitle}>Select the cab style that fits your needs</p>
        </div>
        <div style={styles.cabGrid}>
          {selectedModel.cabOptions.map((cab) => (
            <button key={cab} style={styles.cabCard} onClick={() => handleCabSelect(cab)}>
              <div style={styles.cabIcon}>
                {cab.includes('Regular') && '🚗'}
                {cab.includes('Double') && '🚙'}
                {cab.includes('Crew') && '🛻'}
                {cab.includes('Extended') && '🚙'}
              </div>
              <span style={styles.cabName}>{cab}</span>
              <span style={styles.cabDesc}>
                {cab.includes('Regular') && '2-door, 3 passengers'}
                {cab.includes('Double') && '4-door, 5-6 passengers'}
                {cab.includes('Crew') && '4-door, 5-6 passengers, most room'}
                {cab.includes('Extended') && '4-door, 5 passengers'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 4: Color Selection
  const renderColorSelection = (): JSX.Element | null => {
    if (!selectedModel) return null;
    
    const colors = getModelColors();
    const availableForSecond = colors.filter(c => c.name !== colorChoices.first);

    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <span style={styles.modelBadge}>{selectedModel.name} {selectedCab && `• ${selectedCab}`}</span>
          <h1 style={styles.stepTitle}>🎨 Color Preferences</h1>
          <p style={styles.stepSubtitle}>
            {inventoryCount !== null && `We have ${inventoryCount} ${selectedModel.name} vehicles in stock`}
          </p>
        </div>
        <div style={styles.formSection}>
          <p style={styles.formIntro}>Select up to 2 GM colors for {selectedModel.name} in order of preference:</p>
          <div style={styles.colorSelects}>
            <div style={styles.colorSelectGroup}>
              <label style={styles.inputLabel}>First Choice</label>
              <select 
                style={styles.selectInput} 
                value={colorChoices.first} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleColorChange('first', e.target.value)}
              >
                <option value="">Select a color...</option>
                {colors.map((color) => (
                  <option key={color.code} value={color.name}>
                    {color.name} {color.premium && `(+$${color.price})`}
                  </option>
                ))}
              </select>
              {colorChoices.first && (
                <div style={styles.colorPreview}>
                  <div style={{...styles.colorSwatch, backgroundColor: colors.find(c => c.name === colorChoices.first)?.hex || '#666'}} />
                  <span>{colorChoices.first}</span>
                </div>
              )}
            </div>
            <div style={styles.colorSelectGroup}>
              <label style={styles.inputLabel}>Second Choice</label>
              <select 
                style={{...styles.selectInput, opacity: colorChoices.first ? 1 : 0.5}} 
                value={colorChoices.second} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleColorChange('second', e.target.value)} 
                disabled={!colorChoices.first}
              >
                <option value="">Select a color...</option>
                {availableForSecond.map((color) => (
                  <option key={color.code} value={color.name}>
                    {color.name} {color.premium && `(+$${color.price})`}
                  </option>
                ))}
              </select>
              {colorChoices.second && (
                <div style={styles.colorPreview}>
                  <div style={{...styles.colorSwatch, backgroundColor: colors.find(c => c.name === colorChoices.second)?.hex || '#666'}} />
                  <span>{colorChoices.second}</span>
                </div>
              )}
            </div>
          </div>
          <button style={styles.continueButton} onClick={() => setStep(5)}>
            Continue to Budget
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Step 5: Budget Selection
  const renderBudgetSelection = (): JSX.Element | null => {
    if (!selectedModel) return null;
    
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
    
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <span style={styles.modelBadge}>{selectedModel.name} {selectedCab && `• ${selectedCab}`}</span>
          <h1 style={styles.stepTitle}>💰 Monthly Budget</h1>
          <p style={styles.stepSubtitle}>What monthly payment range works for you?</p>
        </div>
        <div style={styles.formSection}>
          <div style={styles.budgetDisplay}>
            <span style={styles.budgetValue}>${budgetRange.min.toLocaleString()}</span>
            <span style={styles.budgetSeparator}>to</span>
            <span style={styles.budgetValue}>${budgetRange.max.toLocaleString()}</span>
            <span style={styles.budgetLabel}>/month</span>
          </div>
          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>Target Budget: ${budgetRange.min.toLocaleString()}/mo</label>
            <input 
              type="range" 
              min="200" 
              max="2000" 
              step="50" 
              value={budgetRange.min}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const val = parseInt(e.target.value);
                setBudgetRange(prev => ({ ...prev, min: val, max: Math.max(val + 100, prev.max) }));
              }}
              style={styles.slider}
            />
          </div>
          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>Maximum: ${budgetRange.max.toLocaleString()}/mo</label>
            <input 
              type="range" 
              min="300" 
              max="2500" 
              step="50" 
              value={budgetRange.max}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const val = parseInt(e.target.value);
                setBudgetRange(prev => ({ ...prev, max: val, min: Math.min(val - 100, prev.min) }));
              }}
              style={styles.slider}
            />
          </div>
          <div style={styles.downPaymentSection}>
            <label style={styles.inputLabel}>
              Down Payment <span style={styles.downPaymentDisclaimer}>(MOST LENDERS PREFER AT LEAST 20% INITIAL INVESTMENT)</span>
            </label>
            <div style={styles.downPaymentOptions}>
              {[0, 5, 10, 15, 20].map((percent) => (
                <button 
                  key={percent}
                  style={{...styles.optionButton, ...(downPaymentPercent === percent ? styles.optionButtonActive : {})}}
                  onClick={() => setDownPaymentPercent(percent)}
                >
                  {percent === 0 ? '$0' : `${percent}.00%`}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.buyingPowerSection}>
            <p style={styles.buyingPowerIntro}>
              Here's the straight-up math on what that budget really buys today.
            </p>
            
            <div style={styles.buyingPowerCard}>
              <h4 style={styles.buyingPowerTitle}>📊 Your Buying Power</h4>
              <ul style={styles.buyingPowerList}>
                <li>Down payment: <strong>{downPaymentPercent === 0 ? '$0' : `${downPaymentPercent}% (~$${Math.round(downPaymentAmount).toLocaleString()})`}</strong></li>
                <li>Monthly payment: <strong>${budgetRange.max.toLocaleString()}</strong></li>
                <li>Term: <strong>{term} months</strong></li>
                <li>APR: <strong>7%</strong></li>
              </ul>
              
              <p style={styles.buyingPowerText}>
                Using standard auto-loan amortization, your <strong>loan amount</strong> (what the payment supports) comes out to:
              </p>
              
              <div style={styles.buyingPowerResult}>
                <span>👍 Approximately:</span>
                <strong>${Math.round(loanAmount).toLocaleString()} financed</strong>
              </div>
              
              <p style={styles.buyingPowerText}>
                {downPaymentPercent > 0 
                  ? `Add your ${downPaymentPercent}% down payment (~$${Math.round(downPaymentAmount).toLocaleString()}):`
                  : 'With $0 down payment:'
                }
              </p>
              
              <div style={styles.buyingPowerTotal}>
                <span>🚗 Estimated max vehicle sale price:</span>
                <strong>~${Math.round(totalBuyingPower).toLocaleString()}</strong>
              </div>
            </div>

            <div style={styles.mathBreakdown}>
              <h4 style={styles.mathTitle}>📋 How it breaks down</h4>
              <ul style={styles.mathList}>
                <li>Monthly rate = {(APR * 100).toFixed(0)}% / 12 = {(monthlyRate * 100).toFixed(4)}%</li>
                <li>Payment factor over {term} months gives you ~${Math.round(loanAmount / 1000)}k in borrowing power.</li>
                <li>Total buying power = loan amount {downPaymentPercent > 0 ? `+ ${downPaymentPercent}% down payment` : '(no down payment)'}.</li>
              </ul>
            </div>
          </div>

          <button style={styles.continueButton} onClick={() => setStep(6)}>
            Continue
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          
          <p style={styles.disclaimer}>Taxes and Dealer fees separate.</p>
        </div>
      </div>
    );
  };

  // Step 6: Trade-In Qualification
  const renderTradeInQualification = (): JSX.Element | null => {
    if (!selectedModel) return null;
    
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <span style={styles.modelBadge}>{selectedModel.name} {selectedCab && `• ${selectedCab}`}</span>
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
                    {TRADE_IN_MAKES.map((make) => (
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
                    disabled={!tradeVehicle.make}
                  >
                    <option value="">Select Model</option>
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
                        placeholder="18000"
                        value={payoffFocused ? payoffAmount : (payoffAmount ? formatCurrency(payoffAmount) : '')}
                        onChange={handlePayoffAmountChange}
                        onFocus={() => setPayoffFocused(true)}
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
                        placeholder="450"
                        value={monthlyFocused ? monthlyPayment : (monthlyPayment ? formatCurrency(monthlyPayment) : '')}
                        onChange={handleMonthlyPaymentChange}
                        onFocus={() => setMonthlyFocused(true)}
                        onBlur={handleMonthlyBlur}
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
            Find My {selectedModel.name}
          </button>
        </div>
      </div>
    );
  };

  // Progress bar
  const totalSteps = selectedModel?.cabOptions ? 6 : 5;
  const adjustedStep = selectedModel?.cabOptions ? step : (step > 2 ? step - 1 : step);

  return (
    <div style={styles.container}>
      {step === 1 && renderCategorySelection()}
      {step === 2 && renderModelSelection()}
      {step === 3 && renderCabSelection()}
      {step === 4 && renderColorSelection()}
      {step === 5 && renderBudgetSelection()}
      {step === 6 && renderTradeInQualification()}

      <div style={styles.progressBar}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={{
            ...styles.progressDot,
            ...(i + 1 <= adjustedStep ? styles.progressDotActive : {}),
            ...(i + 1 < adjustedStep ? styles.progressDotComplete : {}),
          }} />
        ))}
      </div>
    </div>
  );
};

export default ModelBudgetSelector;
