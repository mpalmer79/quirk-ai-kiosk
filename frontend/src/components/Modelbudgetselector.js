import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

// GM Official Color Library by Model
const GM_COLORS = {
  // Silverado 1500
  'Silverado 1500': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Red Hot', code: 'G7C', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Cypress Gray', code: 'GBD', premium: false },
    { name: 'Riptide Blue Metallic', code: 'GJV', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', premium: true, price: 995 },
  ],
  // Silverado 2500HD / 3500HD
  'Silverado 2500HD': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Red Hot', code: 'G7C', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Cypress Gray', code: 'GBD', premium: false },
  ],
  'Silverado 3500HD': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Red Hot', code: 'G7C', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
  ],
  // Colorado
  'Colorado': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Nitro Yellow Metallic', code: 'G9K', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
  ],
  // Equinox
  'Equinox': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Cacti Green', code: 'GSW', premium: false },
    { name: 'Lakeshore Blue Metallic', code: 'GXP', premium: false },
    { name: 'Reef Blue Metallic', code: 'GMU', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', premium: true, price: 995 },
  ],
  // Trax
  'Trax': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Cacti Green', code: 'GSW', premium: false },
    { name: 'Crimson Metallic', code: 'GSS', premium: false },
  ],
  // Trailblazer
  'Trailblazer': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Nitro Yellow Metallic', code: 'G9K', premium: false },
    { name: 'Oasis Blue', code: 'GMD', premium: false },
  ],
  // Blazer
  'Blazer': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', premium: true, price: 995 },
  ],
  // Traverse
  'Traverse': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Lakeshore Blue Metallic', code: 'GXP', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
  ],
  // Tahoe
  'Tahoe': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Empire Beige Metallic', code: 'GNK', premium: false },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', premium: true, price: 995 },
  ],
  // Suburban
  'Suburban': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Empire Beige Metallic', code: 'GNK', premium: false },
    { name: 'Iridescent Pearl Tricoat', code: 'G1W', premium: true, price: 995 },
  ],
  // Corvette
  'Corvette': [
    { name: 'Arctic White', code: 'G8G', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Torch Red', code: 'GKZ', premium: false },
    { name: 'Rapid Blue', code: 'GMO', premium: false },
    { name: 'Amplify Orange Tintcoat', code: 'G48', premium: true, price: 995 },
    { name: 'Riptide Blue Metallic', code: 'GJV', premium: false },
  ],
  // Camaro
  'Camaro': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Red Hot', code: 'G7C', premium: false },
    { name: 'Crush', code: 'G16', premium: false },
    { name: 'Riverside Blue Metallic', code: 'GKK', premium: false },
  ],
  // Malibu
  'Malibu': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Mosaic Black Metallic', code: 'GB8', premium: false },
    { name: 'Sterling Gray Metallic', code: 'GXD', premium: false },
    { name: 'Radiant Red Tintcoat', code: 'GSK', premium: true, price: 495 },
  ],
  // Bolt EV/EUV
  'Bolt EV': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Bright Blue Metallic', code: 'G1M', premium: false },
    { name: 'Gray Ghost Metallic', code: 'GRX', premium: false },
  ],
  'Bolt EUV': [
    { name: 'Summit White', code: 'GAZ', premium: false },
    { name: 'Black', code: 'GBA', premium: false },
    { name: 'Bright Blue Metallic', code: 'G1M', premium: false },
    { name: 'Ice Blue Metallic', code: 'GLS', premium: false },
  ],
};

// Vehicle categories and models
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
  const [step, setStep] = useState(1); // 1: Category, 2: Model, 3: Configuration, 4: Colors/Budget
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCab, setSelectedCab] = useState(null);
  const [colorChoices, setColorChoices] = useState({ first: '', second: '', third: '' });
  const [budgetRange, setBudgetRange] = useState({ min: 300, max: 1000 });
  const [downPayment, setDownPayment] = useState(3000);
  const [inventoryCount, setInventoryCount] = useState(null);

  // Get available colors for selected model
  const getModelColors = () => {
    if (!selectedModel) return [];
    return GM_COLORS[selectedModel.name] || GM_COLORS['Equinox']; // Default to Equinox colors
  };

  // Check inventory count when model/cab changes
  useEffect(() => {
    const checkInventory = async () => {
      if (selectedModel) {
        try {
          const params = { model: selectedModel.name };
          const response = await inventoryAPI.getAll(params);
          setInventoryCount(response.data?.vehicles?.length || 0);
        } catch (err) {
          console.error('Error checking inventory:', err);
        }
      }
    };
    checkInventory();
  }, [selectedModel, selectedCab]);

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setSelectedModel(null);
    setSelectedCab(null);
    setStep(2);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    // If model has cab options, go to configuration step
    if (model.cabOptions) {
      setStep(3);
    } else {
      setStep(4);
    }
  };

  const handleCabSelect = (cab) => {
    setSelectedCab(cab);
    setStep(4);
  };

  const handleColorChange = (choice, value) => {
    setColorChoices(prev => ({ ...prev, [choice]: value }));
  };

  const handleSearch = () => {
    // Build search criteria
    const searchCriteria = {
      selectedModel: selectedModel?.name,
      selectedCab: selectedCab,
      colorPreferences: [colorChoices.first, colorChoices.second, colorChoices.third].filter(Boolean),
      budgetRange,
      downPayment,
    };
    
    updateCustomerData({
      ...searchCriteria,
      path: 'modelBudget',
    });
    
    navigateTo('inventory');
  };

  const handleBack = () => {
    if (step === 4 && selectedModel?.cabOptions) {
      setStep(3);
    } else if (step === 4) {
      setStep(2);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setSelectedCategory(null);
    }
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
          <button
            key={key}
            style={styles.categoryCard}
            onClick={() => handleCategorySelect(key)}
          >
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
            <button
              key={model.name}
              style={styles.modelCard}
              onClick={() => handleModelSelect(model)}
            >
              <div style={styles.modelInitial}>{model.name.charAt(0)}</div>
              <span style={styles.modelName}>{model.name}</span>
              {model.cabOptions && (
                <span style={styles.modelConfig}>{model.cabOptions.length} configurations</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 3: Cab/Configuration Selection (for trucks)
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
          <button
            key={cab}
            style={styles.cabCard}
            onClick={() => handleCabSelect(cab)}
          >
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
              {cab.includes('Crew') && '4-door, 5-6 passengers, most space'}
              {cab.includes('Extended') && '4-door, 5 passengers'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Colors and Budget
  const renderColorsBudget = () => {
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
          <span style={styles.modelBadge}>
            {selectedModel.name} {selectedCab && `• ${selectedCab}`}
          </span>
          <h1 style={styles.stepTitle}>Color Preferences & Budget</h1>
          <p style={styles.stepSubtitle}>
            {inventoryCount !== null && `We have ${inventoryCount} ${selectedModel.name} vehicles in stock`}
          </p>
        </div>

        <div style={styles.configSection}>
          {/* Color Preferences */}
          <div style={styles.colorSection}>
            <h3 style={styles.sectionTitle}>🎨 Color Preferences</h3>
            <p style={styles.sectionDesc}>Select up to 3 colors in order of preference</p>
            
            <div style={styles.colorSelects}>
              <div style={styles.colorSelect}>
                <label style={styles.colorLabel}>First Choice</label>
                <select
                  style={styles.selectInput}
                  value={colorChoices.first}
                  onChange={(e) => handleColorChange('first', e.target.value)}
                >
                  <option value="">Any color</option>
                  {colors.map((color) => (
                    <option key={color.code} value={color.name}>
                      {color.name} {color.premium && `(+$${color.price})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.colorSelect}>
                <label style={styles.colorLabel}>Second Choice</label>
                <select
                  style={styles.selectInput}
                  value={colorChoices.second}
                  onChange={(e) => handleColorChange('second', e.target.value)}
                  disabled={!colorChoices.first}
                >
                  <option value="">Any color</option>
                  {availableForSecond.map((color) => (
                    <option key={color.code} value={color.name}>
                      {color.name} {color.premium && `(+$${color.price})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.colorSelect}>
                <label style={styles.colorLabel}>Third Choice</label>
                <select
                  style={styles.selectInput}
                  value={colorChoices.third}
                  onChange={(e) => handleColorChange('third', e.target.value)}
                  disabled={!colorChoices.second}
                >
                  <option value="">Any color</option>
                  {availableForThird.map((color) => (
                    <option key={color.code} value={color.name}>
                      {color.name} {color.premium && `(+$${color.price})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div style={styles.budgetSection}>
            <h3 style={styles.sectionTitle}>💰 Monthly Budget</h3>
            <p style={styles.sectionDesc}>What monthly payment range works for you?</p>
            
            <div style={styles.budgetDisplay}>
              <span style={styles.budgetValue}>${budgetRange.min}</span>
              <span style={styles.budgetSeparator}>to</span>
              <span style={styles.budgetValue}>${budgetRange.max}</span>
              <span style={styles.budgetLabel}>/month</span>
            </div>

            <div style={styles.sliderContainer}>
              <input
                type="range"
                min="200"
                max="2000"
                step="50"
                value={budgetRange.min}
                onChange={(e) => setBudgetRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                style={styles.slider}
              />
              <input
                type="range"
                min="200"
                max="2000"
                step="50"
                value={budgetRange.max}
                onChange={(e) => setBudgetRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                style={styles.slider}
              />
            </div>

            <div style={styles.downPaymentSection}>
              <label style={styles.colorLabel}>Down Payment</label>
              <div style={styles.downPaymentOptions}>
                {[0, 2000, 3000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    style={{
                      ...styles.downPaymentButton,
                      ...(downPayment === amount ? styles.downPaymentButtonActive : {}),
                    }}
                    onClick={() => setDownPayment(amount)}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button style={styles.searchButton} onClick={handleSearch}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          Find My {selectedModel.name}
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {step === 1 && renderCategorySelection()}
      {step === 2 && renderModelSelection()}
      {step === 3 && renderCabSelection()}
      {step === 4 && renderColorsBudget()}

      {/* Progress Indicator */}
      <div style={styles.progressBar}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              ...styles.progressDot,
              ...(s <= step ? styles.progressDotActive : {}),
              ...(s < step ? styles.progressDotComplete : {}),
            }}
          />
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
    maxWidth: '1000px',
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
    marginBottom: '40px',
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
    fontSize: '32px',
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
    marginBottom: '16px',
  },
  modelBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(37, 99, 235, 0.2)',
    borderRadius: '20px',
    color: '#60a5fa',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryIcon: {
    fontSize: '48px',
  },
  categoryName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  categoryCount: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
  },
  modelName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  modelConfig: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  cabGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    width: '100%',
  },
  cabCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cabIcon: {
    fontSize: '48px',
  },
  cabName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
  },
  cabDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  configSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  colorSection: {
    padding: '24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  sectionDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 20px 0',
  },
  colorSelects: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  colorSelect: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  colorLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  selectInput: {
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
  },
  budgetSection: {
    padding: '24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  budgetDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  budgetValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#4ade80',
  },
  budgetSeparator: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.5)',
  },
  budgetLabel: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
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
    marginTop: '16px',
  },
  downPaymentOptions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  downPaymentButton: {
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  downPaymentButtonActive: {
    background: 'rgba(27, 115, 64, 0.3)',
    borderColor: '#1B7340',
    color: '#4ade80',
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
    padding: '20px 32px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '32px',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '40px',
  },
  progressDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    transition: 'all 0.3s ease',
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
