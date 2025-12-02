import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

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
};

const VEHICLE_CATEGORIES = {
  trucks: {
    name: 'Trucks',
    icon: '🚛',
    models: [
      { name: 'Silverado 1500', cabOptions: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { name: 'Silverado 2500HD', cabOptions: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { name: 'Silverado 3500HD', cabOptions: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { name: 'Colorado', cabOptions: ['Extended Cab', 'Crew Cab'] },
    ],
  },
  suvs: {
    name: 'SUVs & Crossovers',
    icon: '🚙',
    models: [
      { name: 'Trax' },
      { name: 'Trailblazer' },
      { name: 'Equinox' },
      { name: 'Blazer' },
      { name: 'Traverse' },
      { name: 'Tahoe' },
      { name: 'Suburban' },
    ],
  },
  sports: {
    name: 'Sports Cars',
    icon: '🏎️',
    models: [
      { name: 'Corvette' },
      { name: 'Camaro' },
    ],
  },
  sedans: {
    name: 'Sedans',
    icon: '🚗',
    models: [
      { name: 'Malibu' },
    ],
  },
  electric: {
    name: 'Electric',
    icon: '⚡',
    models: [
      { name: 'Bolt EV' },
      { name: 'Bolt EUV' },
      { name: 'Equinox EV' },
      { name: 'Blazer EV' },
      { name: 'Silverado EV' },
    ],
  },
};

const ModelBudgetSelector = ({ navigateTo, updateCustomerData, customerData }) => {
  // Steps: 1=Category, 2=Model, 3=Cab, 4=Colors, 5=Budget, 6=Trade-In
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCab, setSelectedCab] = useState(null);
  const [colorChoices, setColorChoices] = useState({ first: '', second: '', third: '' });
  const [budgetRange, setBudgetRange] = useState({ min: 400, max: 900 });
  const [downPayment, setDownPayment] = useState(3000);
  const [hasTrade, setHasTrade] = useState(null);
  const [hasPayoff, setHasPayoff] = useState(null);
  const [payoffAmount, setPayoffAmount] = useState('');
  const [inventoryCount, setInventoryCount] = useState(null);

  const getModelColors = () => {
    if (!selectedModel) return [];
    return GM_COLORS[selectedModel.name] || GM_COLORS['Equinox'];
  };

  useEffect(() => {
    const checkInventory = async () => {
      if (selectedModel) {
        try {
          const response = await inventoryAPI.getAll({ model: selectedModel.name });
          setInventoryCount(response.data?.vehicles?.length || 0);
        } catch (err) {
          console.error('Error checking inventory:', err);
        }
      }
    };
    checkInventory();
  }, [selectedModel]);

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
      colorPreferences: [colorChoices.first, colorChoices.second, colorChoices.third].filter(Boolean),
      budgetRange,
      downPayment,
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
    const availableForThird = colors.filter(c => c.name !== colorChoices.first && c.name !== colorChoices.second);

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
          <p style={styles.formIntro}>Select up to 3 GM colors for {selectedModel.name} in order of preference:</p>
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
            <div style={styles.colorSelectGroup}>
              <label style={styles.inputLabel}>Third Choice</label>
              <select style={{...styles.selectInput, opacity: colorChoices.second ? 1 : 0.5}} value={colorChoices.third} onChange={(e) => handleColorChange('third', e.target.value)} disabled={!colorChoices.second}>
                <option value="">Select a color...</option>
                {availableForThird.map((color) => (
                  <option key={color.code} value={color.name}>
                    {color.name} {color.premium && `(+$${color.price})`}
                  </option>
                ))}
              </select>
              {colorChoices.third && (
                <div style={styles.colorPreview}>
                  <div style={{...styles.colorSwatch, backgroundColor: colors.find(c => c.name === colorChoices.third)?.hex || '#666'}} />
                  <span>{colorChoices.third}</span>
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
  const renderBudgetSelection = () => (
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
          <span style={styles.budgetValue}>${budgetRange.min}</span>
          <span style={styles.budgetSeparator}>to</span>
          <span style={styles.budgetValue}>${budgetRange.max}</span>
          <span style={styles.budgetLabel}>/month</span>
        </div>
        <div style={styles.sliderGroup}>
          <label style={styles.sliderLabel}>Minimum: ${budgetRange.min}/mo</label>
          <input type="range" min="200" max="2000" step="50" value={budgetRange.min}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBudgetRange(prev => ({ ...prev, min: val, max: Math.max(val + 100, prev.max) }));
            }}
            style={styles.slider}
          />
        </div>
        <div style={styles.sliderGroup}>
          <label style={styles.sliderLabel}>Maximum: ${budgetRange.max}/mo</label>
          <input type="range" min="300" max="2500" step="50" value={budgetRange.max}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBudgetRange(prev => ({ ...prev, max: val, min: Math.min(val - 100, prev.min) }));
            }}
            style={styles.slider}
          />
        </div>
        <div style={styles.downPaymentSection}>
          <label style={styles.inputLabel}>Down Payment</label>
          <div style={styles.downPaymentOptions}>
            {[0, 2000, 3000, 5000, 10000].map((amount) => (
              <button key={amount}
                style={{...styles.optionButton, ...(downPayment === amount ? styles.optionButtonActive : {})}}
                onClick={() => setDownPayment(amount)}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <button style={styles.continueButton} onClick={() => setStep(6)}>
          Continue
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );

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
    padding: '40px',
    overflow: 'auto',
  },
  stepContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
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
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '28px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryIcon: { fontSize: '40px' },
  categoryName: { fontSize: '16px', fontWeight: '600', color: '#ffffff' },
  categoryCount: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  modelCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modelInitial: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
  },
  modelName: { fontSize: '16px', fontWeight: '600', color: '#ffffff' },
  modelConfig: { fontSize: '11px', color: 'rgba(255,255,255,0.5)' },
  cabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  cabCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '28px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cabIcon: { fontSize: '40px' },
  cabName: { fontSize: '18px', fontWeight: '600', color: '#ffffff' },
  cabDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  formSection: {
    width: '100%',
    padding: '28px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  formIntro: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '24px',
    textAlign: 'center',
  },
  colorSelects: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
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
  selectInput: {
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
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
    gap: '12px',
    marginBottom: '28px',
  },
  budgetValue: { fontSize: '36px', fontWeight: '700', color: '#4ade80' },
  budgetSeparator: { fontSize: '18px', color: 'rgba(255,255,255,0.5)' },
  budgetLabel: { fontSize: '16px', color: 'rgba(255,255,255,0.5)' },
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
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  optionButton: {
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  optionButtonActive: {
    background: 'rgba(27, 115, 64, 0.3)',
    borderColor: '#1B7340',
    color: '#4ade80',
  },
  tradeOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  tradeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '28px 20px',
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
  tradeIcon: { fontSize: '32px', color: '#4ade80' },
  tradeName: { fontSize: '18px', fontWeight: '600', color: '#ffffff' },
  tradeDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  payoffSection: {
    padding: '20px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  payoffTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '16px',
  },
  payoffOptions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
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
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '32px',
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
};

export default ModelBudgetSelector;
