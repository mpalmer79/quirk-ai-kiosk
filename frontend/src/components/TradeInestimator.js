import React, { useState, useEffect } from 'react';
import api from './api';

const TradeInEstimator = ({ navigateTo, updateCustomerData, customerData }) => {
  const [step, setStep] = useState(1);
  const [tradeData, setTradeData] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    condition: '',
    vin: '',
  });
  const [estimate, setEstimate] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);

  const years = Array.from({ length: 15 }, (_, i) => 2025 - i);

  const conditions = [
    { value: 'excellent', label: 'Excellent', desc: 'Like new, no visible wear', multiplier: 1.05 },
    { value: 'good', label: 'Good', desc: 'Minor wear, well maintained', multiplier: 1.0 },
    { value: 'fair', label: 'Fair', desc: 'Normal wear for age/miles', multiplier: 0.9 },
    { value: 'poor', label: 'Poor', desc: 'Significant wear or damage', multiplier: 0.75 },
  ];

  // Fetch makes on mount
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const result = await api.getMakes();
        setMakes(result.makes || []);
      } catch (err) {
        console.error('Failed to fetch makes:', err);
        // Fallback makes
        setMakes([
          'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
          'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
          'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Ram', 'Subaru',
          'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
        ]);
      }
    };
    fetchMakes();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!tradeData.make) {
        setModels([]);
        return;
      }
      
      try {
        const result = await api.getModels(tradeData.make);
        setModels(result.models || []);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModels(['Model 1', 'Model 2', 'Model 3']);
      }
    };
    fetchModels();
  }, [tradeData.make]);

  const handleInputChange = (field, value) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Clear dependent fields
    if (field === 'make') {
      setTradeData(prev => ({ ...prev, model: '', trim: '' }));
    }
  };

  // Handle VIN decode
  const handleVinDecode = async () => {
    if (tradeData.vin.length !== 17) return;
    
    try {
      const decoded = await api.decodeTradeInVin(tradeData.vin);
      if (decoded) {
        setTradeData(prev => ({
          ...prev,
          year: decoded.year?.toString() || prev.year,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          trim: decoded.trim || prev.trim,
        }));
      }
    } catch (err) {
      console.error('Failed to decode VIN:', err);
    }
  };

  const calculateEstimate = async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await api.getTradeInEstimate({
        year: parseInt(tradeData.year),
        make: tradeData.make,
        model: tradeData.model,
        trim: tradeData.trim,
        mileage: parseInt(tradeData.mileage),
        condition: tradeData.condition,
        vin: tradeData.vin,
      });
      
      setEstimate(result);
      setStep(3);
    } catch (err) {
      setError('Unable to calculate estimate. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyTrade = () => {
    updateCustomerData({
      tradeIn: {
        ...tradeData,
        estimatedValue: estimate.mid,
        estimateRange: estimate,
      },
    });
    navigateTo('paymentCalculator');
  };

  const handleRequestAppraisal = async () => {
    try {
      await api.requestAppraisal({
        year: parseInt(tradeData.year),
        make: tradeData.make,
        model: tradeData.model,
        trim: tradeData.trim,
        mileage: parseInt(tradeData.mileage),
        condition: tradeData.condition,
        vin: tradeData.vin,
      });
      
      updateCustomerData({
        tradeIn: {
          ...tradeData,
          estimatedValue: estimate.mid,
          estimateRange: estimate,
          requestedAppraisal: true,
        },
      });
      navigateTo('handoff');
    } catch (err) {
      setError('Unable to request appraisal. Please try again.');
    }
  };

  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>Tell us about your trade-in</h2>
      <p style={styles.stepSubtitle}>We'll give you an instant estimate</p>

      <div style={styles.formGrid}>
        {/* Year */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Year</label>
          <select
            style={styles.select}
            value={tradeData.year}
            onChange={(e) => handleInputChange('year', e.target.value)}
          >
            <option value="">Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Make */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Make</label>
          <select
            style={styles.select}
            value={tradeData.make}
            onChange={(e) => handleInputChange('make', e.target.value)}
          >
            <option value="">Select Make</option>
            {makes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Model</label>
          <select
            style={styles.select}
            value={tradeData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            disabled={!tradeData.make}
          >
            <option value="">Select Model</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Mileage */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Current Mileage</label>
          <input
            type="number"
            style={styles.input}
            placeholder="e.g., 45000"
            value={tradeData.mileage}
            onChange={(e) => handleInputChange('mileage', e.target.value)}
          />
        </div>
      </div>

      {/* VIN Input (Optional) */}
      <div style={styles.vinSection}>
        <div style={styles.vinHeader}>
          <span style={styles.vinLabel}>Have your VIN? (Optional)</span>
          <span style={styles.vinHint}>For more accurate estimate</span>
        </div>
        <input
          type="text"
          style={styles.vinInput}
          placeholder="Enter 17-character VIN"
          value={tradeData.vin}
          onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
          onBlur={handleVinDecode}
          maxLength={17}
        />
      </div>

      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}

      <button
        style={{
          ...styles.continueButton,
          opacity: tradeData.year && tradeData.make && tradeData.model && tradeData.mileage ? 1 : 0.5,
        }}
        onClick={() => setStep(2)}
        disabled={!tradeData.year || !tradeData.make || !tradeData.model || !tradeData.mileage}
      >
        Continue
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <h2 style={styles.stepTitle}>What condition is your vehicle?</h2>
      <p style={styles.stepSubtitle}>
        {tradeData.year} {tradeData.make} {tradeData.model}
      </p>

      <div style={styles.conditionGrid}>
        {conditions.map((condition) => (
          <button
            key={condition.value}
            style={{
              ...styles.conditionCard,
              borderColor: tradeData.condition === condition.value ? '#1B7340' : 'rgba(255,255,255,0.1)',
              background: tradeData.condition === condition.value ? 'rgba(27, 115, 64, 0.2)' : 'rgba(255,255,255,0.05)',
            }}
            onClick={() => handleInputChange('condition', condition.value)}
          >
            <span style={styles.conditionLabel}>{condition.label}</span>
            <span style={styles.conditionDesc}>{condition.desc}</span>
            {tradeData.condition === condition.value && (
              <div style={styles.conditionCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}

      <button
        style={{
          ...styles.continueButton,
          opacity: tradeData.condition ? 1 : 0.5,
        }}
        onClick={calculateEstimate}
        disabled={!tradeData.condition || isCalculating}
      >
        {isCalculating ? (
          <>
            <span style={styles.spinner} />
            Calculating...
          </>
        ) : (
          <>
            Get My Estimate
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const renderStep3 = () => (
    <div style={styles.stepContent}>
      <div style={styles.estimateCard}>
        <div style={styles.estimateHeader}>
          <span style={styles.estimateIcon}>🚗</span>
          <div>
            <h3 style={styles.estimateVehicle}>
              {tradeData.year} {tradeData.make} {tradeData.model}
            </h3>
            <p style={styles.estimateMiles}>
              {parseInt(tradeData.mileage).toLocaleString()} miles • {conditions.find(c => c.value === tradeData.condition)?.label} condition
            </p>
          </div>
        </div>

        <div style={styles.estimateValueSection}>
          <span style={styles.estimateLabel}>Estimated Trade-In Value</span>
          <div style={styles.estimateRange}>
            <span style={styles.rangeLow}>${estimate?.low?.toLocaleString()}</span>
            <span style={styles.rangeMid}>${estimate?.mid?.toLocaleString()}</span>
            <span style={styles.rangeHigh}>${estimate?.high?.toLocaleString()}</span>
          </div>
          <div style={styles.rangeBar}>
            <div style={styles.rangeBarFill} />
            <div style={styles.rangeMarker} />
          </div>
          <div style={styles.rangeLabels}>
            <span>Low</span>
            <span>Average</span>
            <span>High</span>
          </div>
        </div>

        <div style={styles.estimateDisclaimer}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          This is an estimate. Final value determined by in-person appraisal.
        </div>
      </div>

      <div style={styles.actionButtons}>
        <button style={styles.primaryButton} onClick={handleApplyTrade}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <path d="M8 6h8M8 10h8M8 14h4"/>
          </svg>
          Apply to Payment
        </button>
        
        <button style={styles.secondaryButton} onClick={handleRequestAppraisal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Request Manager Appraisal
        </button>
      </div>

      <button style={styles.startOverLink} onClick={() => { setStep(1); setEstimate(null); }}>
        Start Over with Different Vehicle
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button style={styles.backButton} onClick={() => navigateTo('vehicleDetail')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Vehicle
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        </div>
        <h1 style={styles.title}>Trade-In Estimator</h1>
        <p style={styles.subtitle}>Get an instant estimate for your current vehicle</p>
      </div>

      {/* Progress */}
      <div style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div style={{
              ...styles.progressDot,
              background: step >= s ? '#1B7340' : 'rgba(255,255,255,0.2)',
            }}>
              {step > s ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : s}
            </div>
            {s < 3 && (
              <div style={{
                ...styles.progressLine,
                background: step > s ? '#1B7340' : 'rgba(255,255,255,0.2)',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: '24px 40px',
    overflow: 'auto',
    maxWidth: '700px',
    margin: '0 auto',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
    padding: 0,
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  headerIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  progressDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  progressLine: {
    width: '60px',
    height: '3px',
    borderRadius: '2px',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
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
    padding: 0,
    alignSelf: 'flex-start',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  select: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
  },
  input: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
  },
  vinSection: {
    marginBottom: '24px',
  },
  vinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  vinLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  vinHint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  vinInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  errorMessage: {
    padding: '12px 16px',
    background: 'rgba(220, 38, 38, 0.2)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  conditionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  },
  conditionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  conditionLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  },
  conditionDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  conditionCheck: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#1B7340',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  estimateCard: {
    padding: '24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    marginBottom: '24px',
  },
  estimateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  estimateIcon: {
    fontSize: '40px',
  },
  estimateVehicle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  estimateMiles: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    margin: '4px 0 0 0',
  },
  estimateValueSection: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  estimateLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  estimateRange: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  },
  rangeLow: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.5)',
  },
  rangeMid: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#4ade80',
  },
  rangeHigh: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.5)',
  },
  rangeBar: {
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    position: 'relative',
    marginBottom: '8px',
  },
  rangeBarFill: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, rgba(74,222,128,0.3) 0%, #4ade80 50%, rgba(74,222,128,0.3) 100%)',
    borderRadius: '4px',
  },
  rangeMarker: {
    position: 'absolute',
    left: '50%',
    top: '-4px',
    width: '16px',
    height: '16px',
    background: '#4ade80',
    borderRadius: '50%',
    transform: 'translateX(-50%)',
    border: '3px solid #0a0a0a',
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
  estimateDisclaimer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  startOverLink: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '8px',
  },
};

export default TradeInEstimator;
