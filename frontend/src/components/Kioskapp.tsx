import React, { useState, useEffect, ChangeEvent } from 'react';
import api from './api';
import GM_COLORS from '../types/gmColors';
import { BASE_CATEGORIES, modelMatches } from '../types/vehicleCategories';
import styles from './modelBudgetSelectorStyles';
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

// Generate year options (current year + 1 down to 20 years ago)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => (currentYear + 1 - i).toString());

// Common makes for dropdown - comprehensive list including newer brands
const COMMON_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick', 
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lucid', 'Maserati', 'Mazda', 
  'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Polestar', 
  'Porsche', 'Ram', 'Rivian', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota', 
  'Volkswagen', 'Volvo', 'Other'
];

// Model name to image mapping
const MODEL_IMAGES: Record<string, string> = {
  // Trucks
  'Silverado 1500': '/images/models/1500.jpg',
  'Silverado 2500HD': '/images/models/2500.jpg',
  'Silverado 3500HD': '/images/models/3500.jpg',
  'Colorado': '/images/models/Colorado.jpg',
  // SUVs & Crossovers
  'Trax': '/images/models/trax.webp',
  'Trailblazer': '/images/models/trailblazer.webp',
  'Equinox': '/images/models/equinox.avif',
  'Equinox EV': '/images/models/equinox-ev.webp',
  'Blazer': '/images/models/blazer.webp',
  'Blazer EV': '/images/models/blazer-ev.webp',
  'Traverse': '/images/models/traverse.avif',
  'Tahoe': '/images/models/tahoe.png',
  'Suburban': '/images/models/suburban.avif',
  // Sports Cars
  'Corvette': '/images/models/corvette.webp',
  'Camaro': '/images/models/camaro.webp',
  // Electric
  'Bolt EV': '/images/models/bolt-ev.webp',
  'Bolt EUV': '/images/models/bolt-euv.webp',
  'Silverado EV': '/images/models/silverado-ev.webp',
};

// Cab configuration images - keyed by "ModelName-CabType"
const CAB_IMAGES: Record<string, string> = {
  // Silverado 1500
  'Silverado 1500-Regular Cab': '/images/cabs/1500regcab.jpg',
  'Silverado 1500-Double Cab': '/images/cabs/1500doublecab.jpg',
  'Silverado 1500-Crew Cab': '/images/cabs/1500crewcab.jpg',
  // Silverado 2500HD
  'Silverado 2500HD-Regular Cab': '/images/cabs/2500regcab.jpg',
  'Silverado 2500HD-Double Cab': '/images/cabs/2500doublecab.jpg',
  'Silverado 2500HD-Crew Cab': '/images/cabs/2500crewcab.jpg',
  // Silverado 3500HD
  'Silverado 3500HD-Regular Cab': '/images/cabs/3500regcab.jpg',
  'Silverado 3500HD-Double Cab': '/images/cabs/3500doublecab.jpg',
  'Silverado 3500HD-Crew Cab': '/images/cabs/3500crewcab.jpg',
  // Colorado
  'Colorado-Extended Cab': '/images/cabs/coloradoextcab.jpg',
  'Colorado-Crew Cab': '/images/cabs/coloradocrewcab.jpg',
};

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
  // Track which currency field is focused (show raw value while editing)
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
  const [loadingTradeModels, setLoadingTradeModels] = useState<boolean>(false);

  // Fetch inventory counts on mount to filter available models
  // FIX: Added 5-second timeout to prevent blocking UI when backend is unavailable
  useEffect(() => {
    const INVENTORY_TIMEOUT_MS = 5000;
    
    const loadInventoryCounts = async (): Promise<void> => {
      try {
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Inventory load timeout')), INVENTORY_TIMEOUT_MS)
        );
        
        // Race the API call against the timeout
        const data = await Promise.race([
          api.getInventory({}),
          timeoutPromise
        ]);
        
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
        // Log warning but don't block UI - allow component to render with empty inventory
        console.warn('Failed to load inventory counts:', err);
        setInventoryByModel({});
      } finally {
        // Always set loading to false so UI can render
        setLoadingInventory(false);
      }
    };
    
    loadInventoryCounts();
  }, []);

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
    // Reset model when year or make changes
    setTradeVehicle(prev => ({ ...prev, model: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeVehicle.year, tradeVehicle.make]);

  // Build dynamic categories based on actual inventory
  // UPDATED: Now passes through image property for image-based cards
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
          image: category.image,  // Pass through image path for image-based cards
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

  // Fixed: Allow decimals in currency input - store raw value
  const handlePayoffAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    // Allow only digits and one decimal point
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setPayoffAmount(rawValue);
  };

  // Format payoff on blur
  const handlePayoffBlur = (): void => {
    setFocusedField(null);
    if (payoffAmount) {
      const num = parseFloat(payoffAmount);
      if (!isNaN(num)) {
        setPayoffAmount(num.toFixed(2));
      }
    }
  };

  // Fixed: Allow decimals in currency input - store raw value
  const handleMonthlyPaymentChange = (e: ChangeEvent<HTMLInputElement>): void => {
    // Allow only digits and one decimal point
    const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setMonthlyPayment(rawValue);
  };

  // Format monthly payment on blur
  const handleMonthlyPaymentBlur = (): void => {
    setFocusedField(null);
    if (monthlyPayment) {
      const num = parseFloat(monthlyPayment);
      if (!isNaN(num)) {
        setMonthlyPayment(num.toFixed(2));
      }
    }
  };

  // Get display value for currency fields (formatted when not focused)
  const getDisplayValue = (field: string, rawValue: string): string => {
    if (!rawValue) return '';
    if (focusedField === field) return rawValue;
    const num = parseFloat(rawValue);
    if (isNaN(num)) return rawValue;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleFinancedWithChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFinancedWith(e.target.value);
  };

  const handleTradeVehicleChange = (field: keyof TradeVehicleInfo, value: string): void => {
    setTradeVehicle(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = (): void => {
    if (!selectedModel) return;
    
    // Build customer data object
    const preferences = {
      category: selectedCategory,
      model: selectedModel.name,
      cab: selectedCab,
      colorPreferences: colorChoices,
      budgetRange,
      downPaymentPercent,
      hasTrade,
      tradeVehicle: hasTrade ? tradeVehicle : null,
      hasPayoff,
      payoffAmount: hasPayoff ? payoffAmount : null,
      monthlyPayment: hasPayoff ? monthlyPayment : null,
      financedWith: hasPayoff ? financedWith : null,
    };
    
    // Update customer data context
    if (updateCustomerData) {
      updateCustomerData({
        ...customerData,
        selectedModel: selectedModel.name,
        selectedCab: selectedCab,
        budgetRange: budgetRange,
        bodyStyleFilter: selectedCategory,
        colorPreferences: colorChoices,
        tradeInfo: hasTrade ? {
          ...tradeVehicle,
          hasPayoff,
          payoffAmount: hasPayoff ? payoffAmount : null,
          monthlyPayment: hasPayoff ? monthlyPayment : null,
          financedWith: hasPayoff ? financedWith : null,
        } : null,
      });
    }
    
    // Navigate to inventory with filters
    navigateTo('inventory', preferences);
  };

  // Back button logic
  const handleBack = (): void => {
    if (step === 6) setStep(5);
    else if (step === 5) setStep(selectedModel?.cabOptions ? 4 : 4);
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

  // Step 1: Category Selection - Image-based cards like GM Protection packages
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
      <div style={styles.categorySelectionCard}>
        <div style={styles.categoryGrid}>
          {Object.entries(VEHICLE_CATEGORIES).map(([key, category]) => (
            <button key={key} style={styles.categoryCard} onClick={() => handleCategorySelect(key)}>
              {/* Image container with fallback to emoji */}
              {category.image ? (
                <div style={styles.categoryImageContainer as React.CSSProperties}>
                  <img 
                    src={category.image} 
                    alt={category.name}
                    style={styles.categoryImage as React.CSSProperties}
                    onError={(e) => {
                      // Hide broken image, show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('[data-fallback]') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    data-fallback
                    style={{ 
                      ...styles.categoryImagePlaceholder as React.CSSProperties, 
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <span style={styles.categoryFallbackIcon as React.CSSProperties}>{category.icon}</span>
                  </div>
                  <div style={styles.categoryImageOverlay as React.CSSProperties} />
                </div>
              ) : (
                <div style={styles.categoryImagePlaceholder as React.CSSProperties}>
                  <span style={styles.categoryFallbackIcon as React.CSSProperties}>{category.icon}</span>
                </div>
              )}
              {/* Text content below image */}
              <div style={styles.categoryContent as React.CSSProperties}>
                <div style={styles.categoryName}>{category.name}</div>
                <div style={styles.categoryCount}>{category.models.length} models</div>
              </div>
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
    </div>
  );

  // Step 2: Model Selection - Now with image-based cards like categories
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
          <h1 style={styles.stepTitle}>Which model interests you?</h1>
          <p style={styles.stepSubtitle}>Select a model to see available options</p>
        </div>
        <div style={styles.categorySelectionCard}>
          <div style={styles.modelGrid}>
            {category.models.map((model) => {
            const modelImage = MODEL_IMAGES[model.name];
            return (
              <button key={model.name} style={styles.modelCard} onClick={() => handleModelSelect(model)}>
                {/* Image container with fallback to initial */}
                {modelImage ? (
                  <div style={styles.categoryImageContainer as React.CSSProperties}>
                    <img 
                      src={modelImage} 
                      alt={model.name}
                      style={styles.categoryImage as React.CSSProperties}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('[data-fallback]') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      data-fallback
                      style={{ 
                        ...styles.categoryImagePlaceholder as React.CSSProperties, 
                        display: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <span style={styles.categoryFallbackIcon as React.CSSProperties}>{model.name.charAt(0)}</span>
                    </div>
                    <div style={styles.categoryImageOverlay as React.CSSProperties} />
                  </div>
                ) : (
                  <div style={styles.categoryImagePlaceholder as React.CSSProperties}>
                    <span style={styles.categoryFallbackIcon as React.CSSProperties}>{model.name.charAt(0)}</span>
                  </div>
                )}
                <div style={styles.categoryContent as React.CSSProperties}>
                  <div style={styles.categoryName}>{model.name}</div>
                  <div style={styles.categoryCount}>{model.count} available</div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Cab Selection (for trucks only) - Now with actual vehicle images
  const renderCabSelection = (): JSX.Element | null => {
    if (!selectedModel?.cabOptions) {
      setStep(4);
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
          <h1 style={styles.stepTitle}>Choose your cab configuration</h1>
          <p style={styles.stepSubtitle}>Select the cab style for your {selectedModel.name}</p>
        </div>
        <div style={styles.categorySelectionCard}>
          <div style={styles.cabGrid}>
            {selectedModel.cabOptions.map((cab) => {
              const cabImageKey = `${selectedModel.name}-${cab}`;
              const cabImage = CAB_IMAGES[cabImageKey];
              return (
                <button
                  key={cab}
                  style={{
                    ...styles.cabCard,
                    ...(selectedCab === cab ? styles.cabCardActive : {}),
                  }}
                  onClick={() => handleCabSelect(cab)}
                >
                  {/* Image container with fallback */}
                  {cabImage ? (
                    <div style={styles.cabImageContainer as React.CSSProperties}>
                      <img 
                        src={cabImage} 
                        alt={cab}
                        style={styles.cabImage as React.CSSProperties}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('[data-fallback]') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        data-fallback
                        style={{ 
                          ...styles.cabImagePlaceholder as React.CSSProperties, 
                          display: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <span style={styles.cabFallbackIcon as React.CSSProperties}>🚗</span>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.cabImagePlaceholder as React.CSSProperties}>
                      <span style={styles.cabFallbackIcon as React.CSSProperties}>🚗</span>
                    </div>
                  )}
                  <div style={styles.cabContent as React.CSSProperties}>
                    <span style={styles.cabName}>{cab}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Color Selection
  const renderColorSelection = (): JSX.Element => {
    const colors = getModelColors();
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <h1 style={styles.stepTitle}>🎨 Color Preferences</h1>
          <p style={styles.stepSubtitle}>Choose your preferred exterior colors (optional)</p>
        </div>
        <div style={styles.colorSection}>
          <div style={styles.colorChoiceContainer}>
            <label style={styles.colorLabel}>First Choice</label>
            <div style={styles.colorGrid}>
              {colors.map((color) => (
                <button
                  key={color.code}
                  style={{
                    ...styles.colorSwatch,
                    background: color.hex.includes(',') 
                      ? `linear-gradient(135deg, ${color.hex.split(',')[0]} 50%, ${color.hex.split(',')[1]} 50%)` 
                      : color.hex,
                    ...(colorChoices.first === color.code ? styles.colorSwatchActive : {}),
                  }}
                  onClick={() => handleColorChange('first', color.code)}
                  title={color.name}
                >
                  {colorChoices.first === color.code && (
                    <span style={styles.colorCheck}>✓</span>
                  )}
                </button>
              ))}
            </div>
            {colorChoices.first && (
              <p style={styles.selectedColorName}>
                {colors.find(c => c.code === colorChoices.first)?.name}
              </p>
            )}
          </div>
          <div style={styles.colorChoiceContainer}>
            <label style={styles.colorLabel}>Second Choice</label>
            <div style={styles.colorGrid}>
              {colors.map((color) => (
                <button
                  key={color.code}
                  style={{
                    ...styles.colorSwatch,
                    background: color.hex.includes(',') 
                      ? `linear-gradient(135deg, ${color.hex.split(',')[0]} 50%, ${color.hex.split(',')[1]} 50%)` 
                      : color.hex,
                    ...(colorChoices.second === color.code ? styles.colorSwatchActive : {}),
                    opacity: colorChoices.first === color.code ? 0.3 : 1,
                  }}
                  onClick={() => handleColorChange('second', color.code)}
                  title={color.name}
                  disabled={colorChoices.first === color.code}
                >
                  {colorChoices.second === color.code && (
                    <span style={styles.colorCheck}>✓</span>
                  )}
                </button>
              ))}
            </div>
            {colorChoices.second && (
              <p style={styles.selectedColorName}>
                {colors.find(c => c.code === colorChoices.second)?.name}
              </p>
            )}
          </div>
        </div>
        <button 
          style={styles.continueButton}
          onClick={() => setStep(5)}
        >
          Continue
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    );
  };

  // Step 5: Budget Selection
  const renderBudgetSelection = (): JSX.Element => {
    // Calculate estimated vehicle price range based on monthly payment
    const estimateVehiclePrice = (monthlyPayment: number, downPaymentPercent: number): number => {
      const term = 72; // months
      const rate = 0.069 / 12; // 6.9% APR
      const loanAmount = monthlyPayment * ((1 - Math.pow(1 + rate, -term)) / rate);
      const vehiclePrice = loanAmount / (1 - downPaymentPercent / 100);
      return Math.round(vehiclePrice / 1000) * 1000;
    };

    const minVehiclePrice = estimateVehiclePrice(budgetRange.min, downPaymentPercent);
    const maxVehiclePrice = estimateVehiclePrice(budgetRange.max, downPaymentPercent);

    return (
      <div style={styles.stepContainer}>
        <button style={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div style={styles.stepHeader}>
          <h1 style={styles.stepTitle}>💰 Budget Range</h1>
          <p style={styles.stepSubtitle}>What monthly payment works for you?</p>
        </div>
        <div style={styles.budgetCard}>
          <div style={styles.budgetDisplay}>
            <span style={styles.budgetAmount}>${budgetRange.min}</span>
            <span style={styles.budgetSeparator}>to</span>
            <span style={styles.budgetAmount}>${budgetRange.max}</span>
            <span style={styles.budgetPeriod}>/month</span>
          </div>
          
          <div style={styles.sliderContainer}>
            <label style={styles.sliderLabel}>Minimum Payment</label>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={budgetRange.min}
              onChange={(e) => setBudgetRange(prev => ({ ...prev, min: Math.min(parseInt(e.target.value), prev.max - 50) }))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.sliderContainer}>
            <label style={styles.sliderLabel}>Maximum Payment</label>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={budgetRange.max}
              onChange={(e) => setBudgetRange(prev => ({ ...prev, max: Math.max(parseInt(e.target.value), prev.min + 50) }))}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderContainer}>
            <label style={styles.sliderLabel}>Down Payment: {downPaymentPercent}%</label>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.priceEstimate}>
            <p style={styles.priceEstimateText}>
              Estimated vehicle price range: <strong>${minVehiclePrice.toLocaleString()} - ${maxVehiclePrice.toLocaleString()}</strong>
            </p>
            <p style={styles.priceEstimateNote}>
              Based on 72 months at 6.9% APR with {downPaymentPercent}% down
            </p>
          </div>
        </div>
        <button 
          style={styles.continueButton}
          onClick={() => setStep(6)}
        >
          Continue
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    );
  };

  // Step 6: Trade-In Qualification
  const renderTradeInQualification = (): JSX.Element => (
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
          Find My {selectedModel?.name}
        </button>
      </div>
    </div>
  );

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
