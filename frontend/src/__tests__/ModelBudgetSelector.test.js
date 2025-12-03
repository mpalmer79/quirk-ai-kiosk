import React, { useState, useEffect } from 'react';
import api from './api';                   

// GM Official Color Library by Model (2025 Model Year)
const GM_COLORS = {
  'Silverado 1500': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Red Hot', code: 'G7C', hex: '#c41e3a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Cypress Gray', code: 'GBD', hex: '#4a5548', premium: false },
    { name: 'Riptide Blue Metallic', code: 'GJV', hex: '#1e5aa8', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', hex: '#e8e4d9', premium: true, price: 995 },
  ],
  'Silverado 2500HD': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Red Hot', code: 'G7C', hex: '#c41e3a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Cypress Gray', code: 'GBD', hex: '#4a5548', premium: false },
  ],
  'Silverado 3500HD': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Red Hot', code: 'G7C', hex: '#c41e3a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
  ],
  'Colorado': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Nitro Yellow Metallic', code: 'G9K', hex: '#e6c200', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
  ],
  'Equinox': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', hex: '#1a1a1e', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Cacti Green', code: 'GSW', hex: '#5a6b4a', premium: false },
    { name: 'Lakeshore Blue Metallic', code: 'GXP', hex: '#2d4a6b', premium: false },
    { name: 'Reef Blue Metallic', code: 'GMU', hex: '#1a3a5c', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', hex: '#e8e4d9', premium: true, price: 995 },
  ],
  'Trax': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', hex: '#1a1a1e', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Cacti Green', code: 'GSW', hex: '#5a6b4a', premium: false },
    { name: 'Crimson Metallic', code: 'GSS', hex: '#8b2942', premium: false },
  ],
  'Trailblazer': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', hex: '#1a1a1e', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Nitro Yellow Metallic', code: 'G9K', hex: '#e6c200', premium: false },
    { name: 'Oasis Blue', code: 'GMD', hex: '#5ba4c9', premium: false },
  ],
  'Blazer': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', hex: '#e8e4d9', premium: true, price: 995 },
  ],
  'Traverse': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', hex: '#1a1a1e', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Lakeshore Blue Metallic', code: 'GXP', hex: '#2d4a6b', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
  ],
  'Tahoe': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Empire Beige Metallic', code: 'GNK', hex: '#a89880', premium: false },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', hex: '#e8e4d9', premium: true, price: 995 },
  ],
  'Suburban': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Empire Beige Metallic', code: 'GNK', hex: '#a89880', premium: false },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', hex: '#e8e4d9', premium: true, price: 995 },
  ],
  'Corvette': [
    { name: 'Arctic White', code: 'G8G', hex: '#f8f8f8', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Torch Red', code: 'GKZ', hex: '#cc0000', premium: false },
    { name: 'Rapid Blue', code: 'GMO', hex: '#0066cc', premium: false },
    { name: 'Amplify Orange Tintcoat', code: 'G48', hex: '#ff6600', premium: true, price: 995 },
    { name: 'Riptide Blue Metallic', code: 'GJV', hex: '#1e5aa8', premium: false },
  ],
  'Camaro': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Red Hot', code: 'G7C', hex: '#c41e3a', premium: false },
    { name: 'Crush', code: 'G16', hex: '#ff4500', premium: false },
    { name: 'Riverside Blue Metallic', code: 'GKK', hex: '#1a4a7a', premium: false },
  ],
  'Malibu': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', hex: '#1a1a1e', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', hex: '#8b0000', premium: true, price: 495 },
  ],
  'Bolt EV': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Bright Blue Metallic', code: 'G1M', hex: '#0055aa', premium: false },
    { name: 'Gray Ghost Metallic', code: 'GRX', hex: '#8a8a8a', premium: false },
  ],
  'Bolt EUV': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Bright Blue Metallic', code: 'G1M', hex: '#0055aa', premium: false },
    { name: 'Ice Blue Metallic', code: 'GLS', hex: '#a8c8d8', premium: false },
  ],
  'Silverado EV': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', hex: '#6b6b6b', premium: false },
  ],
  'Equinox EV': [
    { name: 'Summit White', code: 'GAZ', hex: '#f5f5f5', premium: false },
    { name: 'Black', code: 'GBA', hex: '#1a1a1a', premium: false },
    { name: 'Riptide Blue Metallic', code: 'GJV', hex: '#1e5aa8', premium: false },
  ],
};

// Base category definitions - models will be filtered by actual inventory
const BASE_CATEGORIES = {
  trucks: {
    name: 'Trucks',
    icon: '🚛',
    modelNames: ['Silverado 1500', 'Silverado 2500HD', 'Silverado 3500HD', 'Colorado', 'Silverado MD'],
    cabOptions: {
      'Silverado 1500': ['Regular Cab', 'Double Cab', 'Crew Cab'],
      'Silverado 2500HD': ['Regular Cab', 'Double Cab', 'Crew Cab'],
      'Silverado 3500HD': ['Regular Cab', 'Double Cab', 'Crew Cab'],
      'Colorado': ['Extended Cab', 'Crew Cab'],
    },
  },
  suvs: {
    name: 'SUVs & Crossovers',
    icon: '🚙',
    modelNames: ['Trax', 'Trailblazer', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban'],
  },
  sports: {
    name: 'Sports Cars',
    icon: '🏎️',
    modelNames: ['Corvette', 'Camaro'],
  },
  sedans: {
    name: 'Sedans',
    icon: '🚗',
    modelNames: ['Malibu'],
  },
  electric: {
    name: 'Electric',
    icon: '⚡',
    modelNames: ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV', 'Silverado EV'],
  },
};

// Helper to normalize model names for matching
const normalizeModelName = (name) => {
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

// Check if inventory model matches a category model
const modelMatches = (inventoryModel, categoryModel) => {
  const invNorm = normalizeModelName(inventoryModel);
  const catNorm = normalizeModelName(categoryModel);
  
  // Exact match
  if (invNorm === catNorm) return true;
  
  // Inventory model starts with category model (e.g., "Silverado 1500" matches "Silverado 1500 LT")
  if (invNorm.startsWith(catNorm)) return true;
  
  // Handle special cases
  if (catNorm === 'silverado 2500hd' && invNorm.includes('2500')) return true;
  if (catNorm === 'silverado 3500hd' && (invNorm.includes('3500') || invNorm.includes('3500hd cc'))) return true;
  if (catNorm === 'equinox ev' && invNorm === 'equinox ev') return true;
  if (catNorm === 'equinox' && invNorm === 'equinox' && !invNorm.includes('ev')) return true;
  if (catNorm === 'silverado ev' && invNorm === 'silverado ev') return true;
  
  return false;
};

const ModelBudgetSelector = ({ navigateTo, updateCustomerData, customerData }) => {
  // Steps: 1=Category, 2=Model, 3=Cab, 4=Colors, 5=Budget, 6=Trade-In
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCab, setSelectedCab] = useState(null);
  const [colorChoices, setColorChoices] = useState({ first: '', second: '' });
  const [budgetRange, setBudgetRange] = useState({ min: 400, max: 900 });
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [hasTrade, setHasTrade] = useState(null);
  const [hasPayoff, setHasPayoff] = useState(null);
  const [payoffAmount, setPayoffAmount] = useState('');
  const [inventoryCount, setInventoryCount] = useState(null);
  const [inventoryByModel, setInventoryByModel] = useState({});
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Fetch inventory counts on mount to filter available models
  useEffect(() => {
    const loadInventoryCounts = async () => {
      try {
        const data = await api.getInventory({});
        const vehicles = data?.vehicles || data || [];
        
        // Count vehicles by model
        const counts = {};
        vehicles.forEach(vehicle => {
          const model = (vehicle.model || '').trim();
          if (model) {
            // Try to match to our category models
            Object.values(BASE_CATEGORIES).forEach(category => {
              category.modelNames.forEach(categoryModel => {
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

  // Build dynamic categories based on actual inventory
  const VEHICLE_CATEGORIES = Object.entries(BASE_CATEGORIES).reduce((acc, [key, category]) => {
    const availableModels = category.modelNames
      .filter(modelName => (inventoryByModel[modelName] || 0) > 0)
      .map(modelName => ({
        name: modelName,
        count: inventoryByModel[modelName] || 0,
        cabOptions: category.cabOptions?.[modelName],
      }));
    
    // Only include category if it has available models
    if (availableModels.length > 0) {
      acc[key] = {
        name: category.name,
        icon: category.icon,
        models: availableModels,
      };
    }
    
    return acc;
  }, {});

  const getModelColors = () => {
    if (!selectedModel) return [];
    return GM_COLORS[selectedModel.name] || GM_COLORS['Equinox'];
  };

  useEffect(() => {
    // Use pre-loaded inventory count instead of making another API call
    if (selectedModel) {
      setInventoryCount(inventoryByModel[selectedModel.name] || 0);
    }
  }, [selectedModel, inventoryByModel]);

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setSelectedModel(null);
    setSelectedCab(null);
    setStep(2);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setStep(model.cabOptions ? 3 : 4);
  };

  const handleCabSelect = (cab) => {
    setSelectedCab(cab);
    setStep(4);
  };

  const handleColorChange = (choice, value) => {
    setColorChoices(prev => ({ ...prev, [choice]: value }));
  };

  const handleSearch = () => {
    updateCustomerData({
      selectedModel: selectedModel?.name,
      selectedCab,
      colorPreferences: [colorChoices.first, colorChoices.second].filter(Boolean),
      budgetRange,
      downPaymentPercent,
      hasTrade,
      hasPayoff,
      payoffAmount: hasPayoff ? parseFloat(payoffAmount) : null,
      path: 'modelBudget',
    });
    navigateTo('inventory');
  };

  const handleBack = () => {
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
  const renderCategorySelection = () => (
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
    </div>
  );

  // Step 2: Model Selection
  const renderModelSelection = () => {
    const category = VEHICLE_CATEGORIES[selectedCategory];
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
  const renderCabSelection = () => (
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

  // Step 4: Color Selection
  const renderColorSelection = () => {
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
              <select style={styles.selectInput} value={colorChoices.first} onChange={(e) => handleColorChange('first', e.target.value)}>
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
              <select style={{...styles.selectInput, opacity: colorChoices.first ? 1 : 0.5}} value={colorChoices.second} onChange={(e) => handleColorChange('second', e.target.value)} disabled={!colorChoices.first}>
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

  // Step 5: Budget Selection with Buying Power Calculation
  const renderBudgetSelection = () => {
    const APR = 0.07;
    const monthlyRate = APR / 12;
    
    const calculateLoanAmount = (payment, months) => {
      if (monthlyRate === 0) return payment * months;
      return payment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
    };
    
    const estimatedLoan = calculateLoanAmount(budgetRange.max, 84);
    const term = estimatedLoan > 20000 ? 84 : 72;
    const loanAmount = calculateLoanAmount(budgetRange.max, term);
    
    // Calculate total buying power based on down payment percentage
    // If loan covers (100% - downPaymentPercent) of vehicle, then:
    // totalPrice = loanAmount / (1 - downPaymentPercent/100)
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
            <input type="range" min="200" max="2000" step="50" value={budgetRange.min}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setBudgetRange(prev => ({ ...prev, min: val, max: Math.max(val + 100, prev.max) }));
              }}
              style={styles.slider}
            />
          </div>
          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>Maximum: ${budgetRange.max.toLocaleString()}/mo</label>
            <input type="range" min="300" max="2500" step="50" value={budgetRange.max}
              onChange={(e) => {
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
                <button key={percent}
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
  const renderTradeInQualification = () => (
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
            <h3 style={styles.payoffTitle}>Does your trade-in have a loan payoff?</h3>
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
              <div style={styles.payoffAmountGroup}>
                <label style={styles.inputLabel}>Approximate Payoff Amount</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    style={styles.textInput}
                    placeholder="Enter amount"
                    value={payoffAmount}
                    onChange={(e) => setPayoffAmount(e.target.value)}
                  />
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

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    paddingTop: '80px',
    paddingBottom: '40px',
    overflow: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    minHeight: 0,
    boxSizing: 'border-box',
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
  },
  stepContainer: {
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: '100px',
  },
  backButton: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  stepHeader: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '0 10px',
  },
  stepIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    margin: '0 auto 20px',
  },
  stepTitle: {
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(27, 115, 64, 0.2)',
    borderRadius: '20px',
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  modelBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(37, 99, 235, 0.2)',
    borderRadius: '20px',
    color: '#60a5fa',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    width: '100%',
    paddingBottom: '40px',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryIcon: { fontSize: '36px' },
  categoryName: { fontSize: '15px', fontWeight: '600', color: '#ffffff', textAlign: 'center' },
  categoryCount: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    width: '100%',
  },
  modelCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modelInitial: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
  },
  modelName: { fontSize: '15px', fontWeight: '600', color: '#ffffff', textAlign: 'center' },
  modelCount: { fontSize: '12px', color: '#4ade80', fontWeight: '600' },
  modelConfig: { fontSize: '11px', color: 'rgba(255,255,255,0.5)' },
  cabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    width: '100%',
  },
  cabCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cabIcon: { fontSize: '36px' },
  cabName: { fontSize: '16px', fontWeight: '600', color: '#ffffff' },
  cabDesc: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  formSection: {
    width: '100%',
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxSizing: 'border-box',
  },
  formIntro: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '20px',
    textAlign: 'center',
  },
  colorSelects: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  colorSelectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  downPaymentDisclaimer: {
    fontSize: '10px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'none',
    letterSpacing: '0',
    marginLeft: '8px',
  },
  selectInput: {
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  budgetDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  budgetValue: { fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: '700', color: '#4ade80' },
  budgetSeparator: { fontSize: '16px', color: 'rgba(255,255,255,0.5)' },
  budgetLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
  sliderGroup: {
    marginBottom: '20px',
  },
  sliderLabel: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    appearance: 'none',
    background: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },
  downPaymentSection: {
    marginTop: '24px',
    marginBottom: '24px',
  },
  downPaymentOptions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  optionButton: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: '1 1 auto',
    minWidth: '70px',
    textAlign: 'center',
  },
  optionButtonActive: {
    background: 'rgba(27, 115, 64, 0.3)',
    borderColor: '#1B7340',
    color: '#4ade80',
  },
  tradeOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  tradeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tradeCardActive: {
    background: 'rgba(27, 115, 64, 0.15)',
    borderColor: '#1B7340',
  },
  tradeIcon: { fontSize: '28px', color: '#4ade80' },
  tradeName: { fontSize: '16px', fontWeight: '600', color: '#ffffff', textAlign: 'center' },
  tradeDesc: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  payoffSection: {
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  payoffTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '16px',
  },
  payoffOptions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  payoffAmountGroup: {
    marginTop: '16px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  inputPrefix: {
    padding: '14px 12px',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '16px',
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    minWidth: 0,
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '32px',
    marginBottom: '40px',
    paddingBottom: 'env(safe-area-inset-bottom, 20px)',
  },
  progressDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    background: '#1B7340',
    transform: 'scale(1.2)',
  },
  progressDotComplete: {
    background: '#4ade80',
  },
  buyingPowerSection: {
    marginTop: '24px',
    padding: '16px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  buyingPowerIntro: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '16px',
  },
  buyingPowerCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  buyingPowerTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  buyingPowerList: {
    listStyle: 'disc',
    paddingLeft: '20px',
    marginBottom: '16px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  buyingPowerText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '12px',
  },
  buyingPowerResult: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 16px',
    background: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#4ade80',
  },
  buyingPowerTotal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 16px',
    background: 'rgba(37, 99, 235, 0.15)',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#60a5fa',
  },
  mathBreakdown: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
  },
  mathTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mathList: {
    listStyle: 'disc',
    paddingLeft: '20px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    lineHeight: '1.8',
  },
  disclaimer: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
};

export default ModelBudgetSelector;
