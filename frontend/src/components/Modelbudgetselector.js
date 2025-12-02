import React, { useState, useEffect } from 'react';

const ModelBudgetSelector = ({ navigateTo, updateCustomerData, customerData }) => {
  const [step, setStep] = useState(1); // 1: type, 2: model, 3: budget, 4: preferences
  const [selectedType, setSelectedType] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [budget, setBudget] = useState({ min: 300, max: 800 });
  const [downPayment, setDownPayment] = useState(3000);
  const [preferences, setPreferences] = useState({
    cabType: null,
    drivetrain: null,
    condition: 'new',
  });

  const vehicleTypes = [
    { id: 'sedan', label: 'Sedan', icon: '🚗', models: ['Malibu'] },
    { id: 'suv', label: 'SUV / Crossover', icon: '🚙', models: ['Trax', 'Trailblazer', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban'] },
    { id: 'truck', label: 'Truck', icon: '🛻', models: ['Colorado', 'Silverado 1500', 'Silverado HD'] },
    { id: 'sports', label: 'Sports Car', icon: '🏎️', models: ['Corvette', 'Camaro'] },
    { id: 'electric', label: 'Electric', icon: '⚡', models: ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV', 'Silverado EV'] },
  ];

  const modelDetails = {
    'Malibu': { startingPrice: 26200, image: 'sedan', segment: 'Midsize Sedan' },
    'Trax': { startingPrice: 21495, image: 'compact-suv', segment: 'Compact SUV' },
    'Trailblazer': { startingPrice: 24695, image: 'compact-suv', segment: 'Compact SUV' },
    'Equinox': { startingPrice: 30900, image: 'midsize-suv', segment: 'Compact SUV' },
    'Blazer': { startingPrice: 36995, image: 'midsize-suv', segment: 'Midsize SUV' },
    'Traverse': { startingPrice: 36995, image: 'fullsize-suv', segment: '3-Row SUV' },
    'Tahoe': { startingPrice: 58695, image: 'fullsize-suv', segment: 'Full-Size SUV' },
    'Suburban': { startingPrice: 61695, image: 'fullsize-suv', segment: 'Full-Size SUV' },
    'Colorado': { startingPrice: 30695, image: 'midsize-truck', segment: 'Midsize Truck' },
    'Silverado 1500': { startingPrice: 37645, image: 'fullsize-truck', segment: 'Full-Size Truck' },
    'Silverado HD': { startingPrice: 46195, image: 'hd-truck', segment: 'Heavy Duty Truck' },
    'Corvette': { startingPrice: 66995, image: 'sports', segment: 'Sports Car' },
    'Camaro': { startingPrice: 32495, image: 'sports', segment: 'Sports Car' },
    'Bolt EV': { startingPrice: 27495, image: 'electric', segment: 'Electric Hatchback' },
    'Bolt EUV': { startingPrice: 28795, image: 'electric', segment: 'Electric Crossover' },
    'Equinox EV': { startingPrice: 34995, image: 'electric-suv', segment: 'Electric SUV' },
    'Blazer EV': { startingPrice: 51995, image: 'electric-suv', segment: 'Electric SUV' },
    'Silverado EV': { startingPrice: 73590, image: 'electric-truck', segment: 'Electric Truck' },
  };

  const getModelsForType = (typeId) => {
    const type = vehicleTypes.find(t => t.id === typeId);
    return type ? type.models : [];
  };

  const getGradientForModel = (model) => {
    const gradients = {
      'Corvette': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      'Camaro': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'Tahoe': 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
      'Suburban': 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      'Silverado 1500': 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
      'Silverado HD': 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
      'Silverado EV': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    };
    return gradients[model] || 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setSelectedModel(null);
    setStep(2);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    updateCustomerData({ selectedModel: model });
    setStep(3);
  };

  const handleBudgetContinue = () => {
    updateCustomerData({ budgetRange: budget, downPayment });
    if (selectedType === 'truck') {
      setStep(4);
    } else {
      handleSearch();
    }
  };

  const handleSearch = () => {
    updateCustomerData({
      selectedModel,
      budgetRange: budget,
      downPayment,
      preferences,
    });
    navigateTo('inventory');
  };

  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <React.Fragment key={s}>
          <div
            style={{
              ...styles.stepDot,
              background: step >= s ? '#1B7340' : 'rgba(255,255,255,0.2)',
            }}
          >
            {step > s ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              s
            )}
          </div>
          {s < 4 && (
            <div
              style={{
                ...styles.stepLine,
                background: step > s ? '#1B7340' : 'rgba(255,255,255,0.2)',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>What type of vehicle are you looking for?</h2>
      <p style={styles.stepSubtitle}>Select a category to see available models</p>
      
      <div style={styles.typeGrid}>
        {vehicleTypes.map((type) => (
          <button
            key={type.id}
            style={{
              ...styles.typeCard,
              borderColor: selectedType === type.id ? '#1B7340' : 'rgba(255,255,255,0.1)',
              background: selectedType === type.id ? 'rgba(27, 115, 64, 0.2)' : 'rgba(255,255,255,0.05)',
            }}
            onClick={() => handleTypeSelect(type.id)}
          >
            <span style={styles.typeIcon}>{type.icon}</span>
            <span style={styles.typeLabel}>{type.label}</span>
            <span style={styles.typeCount}>{type.models.length} models</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Change vehicle type
      </button>
      
      <h2 style={styles.stepTitle}>Select your Chevrolet model</h2>
      <p style={styles.stepSubtitle}>
        {vehicleTypes.find(t => t.id === selectedType)?.label} models available
      </p>
      
      <div style={styles.modelGrid}>
        {getModelsForType(selectedType).map((model) => (
          <button
            key={model}
            style={{
              ...styles.modelCard,
              borderColor: selectedModel === model ? '#1B7340' : 'rgba(255,255,255,0.1)',
            }}
            onClick={() => handleModelSelect(model)}
          >
            <div style={{
              ...styles.modelImage,
              background: getGradientForModel(model),
            }}>
              <span style={styles.modelImageText}>{model.charAt(0)}</span>
            </div>
            <div style={styles.modelInfo}>
              <h3 style={styles.modelName}>{model}</h3>
              <p style={styles.modelSegment}>{modelDetails[model]?.segment}</p>
              <p style={styles.modelPrice}>
                Starting at ${modelDetails[model]?.startingPrice.toLocaleString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(2)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Change model
      </button>
      
      <h2 style={styles.stepTitle}>Set your budget</h2>
      <p style={styles.stepSubtitle}>
        Looking for a {selectedModel} — let's find one that fits your budget
      </p>

      <div style={styles.budgetSection}>
        {/* Monthly Payment Range */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.sliderLabel}>Monthly Payment Range</span>
            <span style={styles.sliderValue}>
              ${budget.min} — ${budget.max}/mo
            </span>
          </div>
          
          <div style={styles.dualSliderContainer}>
            <input
              type="range"
              min={200}
              max={1500}
              step={50}
              value={budget.min}
              onChange={(e) => setBudget(prev => ({ 
                ...prev, 
                min: Math.min(Number(e.target.value), prev.max - 100) 
              }))}
              style={styles.rangeSlider}
            />
            <input
              type="range"
              min={200}
              max={1500}
              step={50}
              value={budget.max}
              onChange={(e) => setBudget(prev => ({ 
                ...prev, 
                max: Math.max(Number(e.target.value), prev.min + 100) 
              }))}
              style={styles.rangeSlider}
            />
          </div>
          
          <div style={styles.sliderMarks}>
            <span>$200</span>
            <span>$600</span>
            <span>$1,000</span>
            <span>$1,500</span>
          </div>
        </div>

        {/* Down Payment */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.sliderLabel}>Down Payment</span>
            <span style={styles.sliderValue}>${downPayment.toLocaleString()}</span>
          </div>
          
          <input
            type="range"
            min={0}
            max={15000}
            step={500}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            style={styles.rangeSliderSingle}
          />
          
          <div style={styles.sliderMarks}>
            <span>$0</span>
            <span>$5,000</span>
            <span>$10,000</span>
            <span>$15,000</span>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div style={styles.quickSelect}>
          <span style={styles.quickSelectLabel}>Quick select:</span>
          <div style={styles.quickSelectButtons}>
            {[0, 2000, 5000, 10000].map((amount) => (
              <button
                key={amount}
                style={{
                  ...styles.quickSelectButton,
                  background: downPayment === amount ? '#1B7340' : 'transparent',
                }}
                onClick={() => setDownPayment(amount)}
              >
                ${amount === 0 ? '0' : (amount / 1000) + 'K'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button style={styles.continueButton} onClick={handleBudgetContinue}>
        {selectedType === 'truck' ? 'Continue to Preferences' : 'Search Inventory'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(3)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Change budget
      </button>
      
      <h2 style={styles.stepTitle}>Additional preferences</h2>
      <p style={styles.stepSubtitle}>Help us narrow down the perfect {selectedModel}</p>

      <div style={styles.preferencesGrid}>
        {/* Cab Type */}
        <div style={styles.preferenceGroup}>
          <h3 style={styles.preferenceLabel}>Cab Type</h3>
          <div style={styles.optionButtons}>
            {['Regular', 'Double', 'Crew'].map((option) => (
              <button
                key={option}
                style={{
                  ...styles.optionButton,
                  background: preferences.cabType === option ? '#1B7340' : 'rgba(255,255,255,0.05)',
                  borderColor: preferences.cabType === option ? '#1B7340' : 'rgba(255,255,255,0.1)',
                }}
                onClick={() => setPreferences(prev => ({ ...prev, cabType: option }))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Drivetrain */}
        <div style={styles.preferenceGroup}>
          <h3 style={styles.preferenceLabel}>Drivetrain</h3>
          <div style={styles.optionButtons}>
            {['2WD', '4WD'].map((option) => (
              <button
                key={option}
                style={{
                  ...styles.optionButton,
                  background: preferences.drivetrain === option ? '#1B7340' : 'rgba(255,255,255,0.05)',
                  borderColor: preferences.drivetrain === option ? '#1B7340' : 'rgba(255,255,255,0.1)',
                }}
                onClick={() => setPreferences(prev => ({ ...prev, drivetrain: option }))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div style={styles.preferenceGroup}>
          <h3 style={styles.preferenceLabel}>Condition</h3>
          <div style={styles.optionButtons}>
            {['New', 'In Transit'].map((option) => (
              <button
                key={option}
                style={{
                  ...styles.optionButton,
                  background: preferences.condition === option.toLowerCase().replace(' ', '-') ? '#1B7340' : 'rgba(255,255,255,0.05)',
                  borderColor: preferences.condition === option.toLowerCase().replace(' ', '-') ? '#1B7340' : 'rgba(255,255,255,0.1)',
                }}
                onClick={() => setPreferences(prev => ({ ...prev, condition: option.toLowerCase().replace(' ', '-') }))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button style={styles.continueButton} onClick={handleSearch}>
        Search Inventory
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      {renderStepIndicator()}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #1B7340;
          border-radius: 50%;
          margin-top: -8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-track {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #1B7340;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>
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
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '40px',
    gap: '0',
  },
  stepDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    transition: 'all 0.3s ease',
  },
  stepLine: {
    width: '60px',
    height: '3px',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  },
  stepContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '16px',
    alignSelf: 'flex-start',
  },
  stepTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    width: '100%',
    maxWidth: '700px',
  },
  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    borderRadius: '16px',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  typeIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  typeLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  typeCount: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  modelCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    borderRadius: '16px',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  modelImage: {
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelImageText: {
    fontSize: '48px',
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
  },
  modelInfo: {
    padding: '16px',
  },
  modelName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  modelSegment: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 8px 0',
  },
  modelPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4ade80',
    margin: 0,
  },
  budgetSection: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    marginBottom: '32px',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  sliderValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#4ade80',
  },
  dualSliderContainer: {
    position: 'relative',
    height: '24px',
  },
  rangeSlider: {
    position: 'absolute',
    width: '100%',
    pointerEvents: 'auto',
  },
  rangeSliderSingle: {
    width: '100%',
  },
  sliderMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  quickSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  quickSelectLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  quickSelectButtons: {
    display: 'flex',
    gap: '8px',
  },
  quickSelectButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  preferencesGrid: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  preferenceGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  preferenceLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  optionButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  optionButton: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 'auto',
  },
};

export default ModelBudgetSelector;
