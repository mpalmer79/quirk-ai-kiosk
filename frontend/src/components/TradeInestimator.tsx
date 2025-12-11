/**
 * QUIRK AI Kiosk - Trade-In Estimator (Redesigned)
 * 
 * Features:
 * - 5-step flow: Vehicle → Ownership → Payoff → Condition → Results
 * - Full Sales Manager Dashboard integration (payoff, lender, monthly payment)
 * - Photo upload for condition documentation
 * - Mobile-first responsive design
 * - VIN decode with auto-fill
 * - Equity calculation preview
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import api from './api';
import type { PhotoAnalysisResponse } from './api';

// ============================================================================
// Types
// ============================================================================

interface TradeData {
  // Step 1: Vehicle Info
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  vin: string;
  // Step 2: Ownership
  hasPayoff: boolean | null;
  // Step 3: Payoff Details
  payoffAmount: string;
  monthlyPayment: string;
  financedWith: string;
  // Step 4: Condition
  condition: string;
  photos: PhotoData[];
}

interface PhotoData {
  id: string;
  file: File | null;
  preview: string | null;
}

interface EstimateResult {
  low: number;
  mid: number;
  high: number;
  source?: string;
}

interface TradeInEstimatorProps {
  navigateTo: (page: string) => void;
  updateCustomerData: (data: any) => void;
  customerData?: any;
}

interface ConditionOption {
  value: string;
  label: string;
  desc: string;
  icon: string;
  multiplier: number;
}

interface PhotoSpot {
  id: string;
  label: string;
  icon: string;
  required: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const YEARS = Array.from({ length: 15 }, (_, i) => 2025 - i);

const CONDITIONS: ConditionOption[] = [
  { value: 'excellent', label: 'Excellent', desc: 'Like new, no visible wear', icon: '✨', multiplier: 1.05 },
  { value: 'good', label: 'Good', desc: 'Minor wear, well maintained', icon: '👍', multiplier: 1.0 },
  { value: 'fair', label: 'Fair', desc: 'Normal wear for age/miles', icon: '👌', multiplier: 0.9 },
  { value: 'poor', label: 'Poor', desc: 'Significant wear or damage', icon: '⚠️', multiplier: 0.75 },
];

const PHOTO_SPOTS: PhotoSpot[] = [
  { id: 'front', label: 'Front', icon: '🚗', required: false },
  { id: 'rear', label: 'Rear', icon: '🔙', required: false },
  { id: 'interior', label: 'Interior', icon: '🪑', required: false },
  { id: 'odometer', label: 'Odometer', icon: '🔢', required: false },
  { id: 'damage', label: 'Damage', icon: '📸', required: false },
];

const LENDERS = [
  'Toyota Financial Services',
  'Honda Financial Services',
  'GM Financial',
  'Ford Credit',
  'Chase Auto',
  'Capital One Auto',
  'Ally Financial',
  'Bank of America',
  'Wells Fargo Auto',
  'Credit Union',
  'Other',
];

const FALLBACK_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
  'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Ram', 'Subaru',
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// ============================================================================
// Component
// ============================================================================

const TradeInEstimator: React.FC<TradeInEstimatorProps> = ({ 
  navigateTo, 
  updateCustomerData, 
  customerData 
}) => {
  // State
  const [step, setStep] = useState(1);
  const [tradeData, setTradeData] = useState<TradeData>({
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    vin: '',
    hasPayoff: null,
    payoffAmount: '',
    monthlyPayment: '',
    financedWith: '',
    condition: '',
    photos: PHOTO_SPOTS.map(spot => ({ id: spot.id, file: null, preview: null })),
  });
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Photo analysis state
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisResponse | null>(null);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch makes on mount
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const result = await api.getMakes();
        setMakes(result || FALLBACK_MAKES);
      } catch (err) {
        console.error('Failed to fetch makes:', err);
        setMakes(FALLBACK_MAKES);
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
        setModels(result || []);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModels([]);
      }
    };
    fetchModels();
  }, [tradeData.make]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleInputChange = (field: keyof TradeData, value: any) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
    setError(null);

    // Clear dependent fields
    if (field === 'make') {
      setTradeData(prev => ({ ...prev, [field]: value, model: '', trim: '' }));
    }
  };

  const handleVinDecode = async () => {
    if (tradeData.vin.length !== 17) return;

    setIsDecodingVin(true);
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
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handlePhotoUpload = (spotId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTradeData(prev => ({
        ...prev,
        photos: prev.photos.map(p => 
          p.id === spotId 
            ? { ...p, file, preview: e.target?.result as string }
            : p
        ),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (spotId: string) => {
    setTradeData(prev => ({
      ...prev,
      photos: prev.photos.map(p => 
        p.id === spotId 
          ? { ...p, file: null, preview: null }
          : p
      ),
    }));
    // Clear analysis when photos change
    setPhotoAnalysis(null);
    setAnalysisError(null);
  };

  // Analyze photos with AI Vision
  const handleAnalyzePhotos = async () => {
    const photosWithData = tradeData.photos.filter(p => p.preview);
    
    if (photosWithData.length === 0) {
      setAnalysisError('Please upload at least one photo to analyze');
      return;
    }
    
    setIsAnalyzingPhotos(true);
    setAnalysisError(null);
    
    try {
      const photoItems = photosWithData.map(p => ({
        id: p.id,
        data: p.preview as string,
        mimeType: 'image/jpeg',
      }));
      
      const result = await api.analyzeTradeInPhotos(photoItems, {
        year: tradeData.year,
        make: tradeData.make,
        model: tradeData.model,
        mileage: tradeData.mileage,
      });
      
      setPhotoAnalysis(result);
      
      // Auto-suggest condition based on AI assessment
      if (result.overallCondition && result.overallCondition !== 'pending') {
        handleInputChange('condition', result.overallCondition);
      }
      
      // If AI detected mileage and we don't have it, suggest it
      if (result.detectedMileage && !tradeData.mileage) {
        handleInputChange('mileage', result.detectedMileage.replace(/,/g, ''));
      }
      
    } catch (err) {
      console.error('Photo analysis failed:', err);
      setAnalysisError('Unable to analyze photos. You can still proceed with manual condition selection.');
    } finally {
      setIsAnalyzingPhotos(false);
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
        mileage: parseInt(tradeData.mileage.replace(/,/g, '')),
        condition: tradeData.condition as 'excellent' | 'good' | 'fair' | 'poor',
        vin: tradeData.vin,
      });

      // Transform API response to component's EstimateResult format
      setEstimate({
        low: result.range.low,
        mid: result.estimatedValue,
        high: result.range.high,
        source: 'API',
      });
      setStep(5);
    } catch (err) {
      setError('Unable to calculate estimate. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyTrade = () => {
    const tradeInData = {
      hasTrade: true,
      vehicle: {
        year: tradeData.year,
        make: tradeData.make,
        model: tradeData.model,
        trim: tradeData.trim,
        mileage: parseInt(tradeData.mileage.replace(/,/g, '')),
        vin: tradeData.vin,
        condition: tradeData.condition,
      },
      hasPayoff: tradeData.hasPayoff,
      payoffAmount: tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : null,
      monthlyPayment: tradeData.hasPayoff ? parseFloat(tradeData.monthlyPayment.replace(/,/g, '')) : null,
      financedWith: tradeData.hasPayoff ? tradeData.financedWith : null,
      estimatedValue: estimate?.mid || 0,
      estimateRange: estimate,
      equity: estimate?.mid ? estimate.mid - (tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : 0) : null,
      photosUploaded: tradeData.photos.filter(p => p.file !== null).length,
    };

    updateCustomerData({ tradeIn: tradeInData });
    navigateTo('paymentCalculator');
  };

  const handleRequestAppraisal = async () => {
    try {
      await api.requestAppraisal({
        year: parseInt(tradeData.year),
        make: tradeData.make,
        model: tradeData.model,
        trim: tradeData.trim,
        mileage: parseInt(tradeData.mileage.replace(/,/g, '')),
        condition: tradeData.condition as 'excellent' | 'good' | 'fair' | 'poor',
        vin: tradeData.vin,
        customerPhone: '',
      });

      const tradeInData = {
        hasTrade: true,
        vehicle: {
          year: tradeData.year,
          make: tradeData.make,
          model: tradeData.model,
          trim: tradeData.trim,
          mileage: parseInt(tradeData.mileage.replace(/,/g, '')),
          vin: tradeData.vin,
          condition: tradeData.condition,
        },
        hasPayoff: tradeData.hasPayoff,
        payoffAmount: tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : null,
        monthlyPayment: tradeData.hasPayoff ? parseFloat(tradeData.monthlyPayment.replace(/,/g, '')) : null,
        financedWith: tradeData.hasPayoff ? tradeData.financedWith : null,
        estimatedValue: estimate?.mid || 0,
        estimateRange: estimate,
        requestedAppraisal: true,
      };

      updateCustomerData({ tradeIn: tradeInData });
      navigateTo('handoff');
    } catch (err) {
      setError('Unable to request appraisal. Please try again.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatMileage = (value: string) => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString() : '';
  };

  const getEquity = () => {
    if (!estimate?.mid || !tradeData.hasPayoff) return null;
    const payoff = parseFloat(tradeData.payoffAmount.replace(/,/g, '')) || 0;
    return estimate.mid - payoff;
  };

  // Determine which steps to show (skip payoff if owned outright)
  const getActiveSteps = () => {
    if (tradeData.hasPayoff === false) {
      return [1, 2, 4, 5]; // Skip step 3
    }
    return [1, 2, 3, 4, 5];
  };

  const canProceedStep1 = tradeData.year && tradeData.make && tradeData.model && tradeData.mileage;
  const canProceedStep2 = tradeData.hasPayoff !== null;
  const canProceedStep3 = !tradeData.hasPayoff || (tradeData.payoffAmount && tradeData.financedWith);
  const canProceedStep4 = tradeData.condition;

  // ============================================================================
  // Render Steps
  // ============================================================================

  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <h2 style={styles.stepTitle}>Tell us about your vehicle</h2>
      <p style={styles.stepSubtitle}>Enter details or scan your VIN for instant lookup</p>

      {/* VIN Scanner Section */}
      <div style={styles.vinSection}>
        <div style={styles.vinHeader}>
          <div style={styles.vinIconLabel}>
            <span style={{ fontSize: '24px' }}>📷</span>
            <div>
              <span style={styles.vinLabel}>Quick VIN Lookup</span>
              <span style={styles.vinHint}>Auto-fills vehicle info</span>
            </div>
          </div>
        </div>
        <div style={styles.vinInputWrapper}>
          <input
            type="text"
            style={styles.vinInput}
            placeholder="Enter 17-character VIN"
            value={tradeData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
            onBlur={handleVinDecode}
            maxLength={17}
          />
          {isDecodingVin && (
            <div style={styles.vinSpinner}>
              <div style={styles.spinner} />
            </div>
          )}
        </div>
      </div>

      <div style={styles.divider}>
        <span style={styles.dividerText}>or enter manually</span>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Year *</label>
          <select
            style={styles.select}
            value={tradeData.year}
            onChange={(e) => handleInputChange('year', e.target.value)}
          >
            <option value="">Select Year</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Make *</label>
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Model *</label>
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Trim</label>
          <input
            type="text"
            style={styles.input}
            placeholder="e.g., EX-L, Sport"
            value={tradeData.trim}
            onChange={(e) => handleInputChange('trim', e.target.value)}
          />
        </div>

        <div style={{ ...styles.formGroup, ...(isMobile ? {} : { gridColumn: '1 / -1' }) }}>
          <label style={styles.label}>Current Mileage *</label>
          <input
            type="text"
            style={styles.input}
            placeholder="e.g., 45,000"
            value={tradeData.mileage}
            onChange={(e) => handleInputChange('mileage', formatMileage(e.target.value))}
          />
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      <button
        style={{ ...styles.continueButton, opacity: canProceedStep1 ? 1 : 0.5 }}
        onClick={() => setStep(2)}
        disabled={!canProceedStep1}
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

      <h2 style={styles.stepTitle}>Do you owe money on this vehicle?</h2>
      <p style={styles.stepSubtitle}>
        {tradeData.year} {tradeData.make} {tradeData.model}
      </p>

      <div style={styles.ownershipGrid}>
        <button
          style={{
            ...styles.ownershipCard,
            borderColor: tradeData.hasPayoff === true ? '#1B7340' : 'rgba(255,255,255,0.1)',
            background: tradeData.hasPayoff === true ? 'rgba(27, 115, 64, 0.15)' : 'rgba(255,255,255,0.02)',
          }}
          onClick={() => handleInputChange('hasPayoff', true)}
        >
          <span style={styles.ownershipIcon}>🏦</span>
          <span style={styles.ownershipLabel}>Yes, I still owe</span>
          <span style={styles.ownershipDesc}>I have a loan or lease</span>
          {tradeData.hasPayoff === true && <div style={styles.checkBadge}>✓</div>}
        </button>

        <button
          style={{
            ...styles.ownershipCard,
            borderColor: tradeData.hasPayoff === false ? '#1B7340' : 'rgba(255,255,255,0.1)',
            background: tradeData.hasPayoff === false ? 'rgba(27, 115, 64, 0.15)' : 'rgba(255,255,255,0.02)',
          }}
          onClick={() => handleInputChange('hasPayoff', false)}
        >
          <span style={styles.ownershipIcon}>✅</span>
          <span style={styles.ownershipLabel}>No, I own it outright</span>
          <span style={styles.ownershipDesc}>It's paid off</span>
          {tradeData.hasPayoff === false && <div style={styles.checkBadge}>✓</div>}
        </button>
      </div>

      <button
        style={{ ...styles.continueButton, opacity: canProceedStep2 ? 1 : 0.5 }}
        onClick={() => setStep(tradeData.hasPayoff ? 3 : 4)}
        disabled={!canProceedStep2}
      >
        Continue
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(2)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <h2 style={styles.stepTitle}>Tell us about your payoff</h2>
      <p style={styles.stepSubtitle}>This helps us calculate your true equity</p>

      <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr' }}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Approximate Payoff Amount *</label>
          <div style={styles.currencyInputWrapper}>
            <span style={styles.currencySymbol}>$</span>
            <input
              type="text"
              style={{ ...styles.input, paddingLeft: '32px' }}
              placeholder="e.g., 15,000"
              value={tradeData.payoffAmount}
              onChange={(e) => handleInputChange('payoffAmount', formatMileage(e.target.value))}
            />
          </div>
          <span style={styles.inputHint}>💡 Check your lender's app or latest statement</span>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Current Monthly Payment</label>
          <div style={styles.currencyInputWrapper}>
            <span style={styles.currencySymbol}>$</span>
            <input
              type="text"
              style={{ ...styles.input, paddingLeft: '32px' }}
              placeholder="e.g., 450"
              value={tradeData.monthlyPayment}
              onChange={(e) => handleInputChange('monthlyPayment', formatMileage(e.target.value))}
            />
            <span style={styles.currencySuffix}>/mo</span>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Financed With *</label>
          <select
            style={styles.select}
            value={tradeData.financedWith}
            onChange={(e) => handleInputChange('financedWith', e.target.value)}
          >
            <option value="">Select lender...</option>
            {LENDERS.map(lender => (
              <option key={lender} value={lender}>{lender}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      <button
        style={{ ...styles.continueButton, opacity: canProceedStep3 ? 1 : 0.5 }}
        onClick={() => setStep(4)}
        disabled={!canProceedStep3}
      >
        Continue
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div style={styles.stepContent}>
      <button style={styles.backLink} onClick={() => setStep(tradeData.hasPayoff ? 3 : 2)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <h2 style={styles.stepTitle}>Vehicle Condition</h2>
      <p style={styles.stepSubtitle}>Be honest — it helps us give you an accurate estimate</p>

      <div style={styles.conditionGrid}>
        {CONDITIONS.map((condition) => (
          <button
            key={condition.value}
            style={{
              ...styles.conditionCard,
              borderColor: tradeData.condition === condition.value ? '#1B7340' : 'rgba(255,255,255,0.1)',
              background: tradeData.condition === condition.value ? 'rgba(27, 115, 64, 0.15)' : 'rgba(255,255,255,0.02)',
            }}
            onClick={() => handleInputChange('condition', condition.value)}
          >
            <span style={styles.conditionIcon}>{condition.icon}</span>
            <span style={styles.conditionLabel}>{condition.label}</span>
            <span style={styles.conditionDesc}>{condition.desc}</span>
            {tradeData.condition === condition.value && <div style={styles.conditionCheck}>✓</div>}
          </button>
        ))}
      </div>

      {/* Photo Upload Section */}
      <div style={styles.photoSection}>
        <div style={styles.photoHeader}>
          <label style={styles.label}>📸 Photos (Optional)</label>
          <span style={styles.photoHint}>Upload photos for AI condition analysis</span>
        </div>
        <div style={styles.photoGrid}>
          {PHOTO_SPOTS.map((spot) => {
            const photoData = tradeData.photos.find(p => p.id === spot.id);
            return (
              <div
                key={spot.id}
                style={{
                  ...styles.photoSpot,
                  backgroundImage: photoData?.preview ? `url(${photoData.preview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => fileInputRefs.current[spot.id]?.click()}
              >
                {!photoData?.preview && (
                  <>
                    <span style={styles.photoIcon}>{spot.icon}</span>
                    <span style={styles.photoLabel}>{spot.label}</span>
                  </>
                )}
                {photoData?.preview && (
                  <button
                    style={styles.photoRemove}
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(spot.id); }}
                  >
                    ✕
                  </button>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[spot.id] = el; }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(spot.id, file);
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Analyze Photos Button */}
        {tradeData.photos.some(p => p.preview) && !photoAnalysis && (
          <button
            style={{
              ...styles.analyzeButton,
              opacity: isAnalyzingPhotos ? 0.7 : 1,
            }}
            onClick={handleAnalyzePhotos}
            disabled={isAnalyzingPhotos}
          >
            {isAnalyzingPhotos ? (
              <>
                <div style={styles.spinner} />
                Analyzing with AI...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                Analyze Photos with AI
              </>
            )}
          </button>
        )}
        
        {analysisError && (
          <div style={styles.analysisError}>{analysisError}</div>
        )}
        
        {/* Photo Analysis Results */}
        {photoAnalysis && (
          <div style={styles.analysisResults}>
            <div style={styles.analysisHeader}>
              <div style={styles.analysisTitle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                AI Condition Assessment
              </div>
              <div style={{
                ...styles.conditionBadge,
                background: photoAnalysis.overallCondition === 'excellent' ? 'rgba(74, 222, 128, 0.2)' :
                           photoAnalysis.overallCondition === 'good' ? 'rgba(96, 165, 250, 0.2)' :
                           photoAnalysis.overallCondition === 'fair' ? 'rgba(251, 191, 36, 0.2)' :
                           photoAnalysis.overallCondition === 'poor' ? 'rgba(248, 113, 113, 0.2)' :
                           'rgba(255,255,255,0.1)',
                color: photoAnalysis.overallCondition === 'excellent' ? '#4ade80' :
                       photoAnalysis.overallCondition === 'good' ? '#60a5fa' :
                       photoAnalysis.overallCondition === 'fair' ? '#fbbf24' :
                       photoAnalysis.overallCondition === 'poor' ? '#f87171' :
                       'rgba(255,255,255,0.6)',
              }}>
                {photoAnalysis.overallCondition.charAt(0).toUpperCase() + photoAnalysis.overallCondition.slice(1)}
                {photoAnalysis.conditionScore > 0 && ` (${photoAnalysis.conditionScore}/100)`}
              </div>
            </div>
            
            <p style={styles.analysisSummary}>{photoAnalysis.summary}</p>
            
            {photoAnalysis.detectedMileage && (
              <div style={styles.detectedMileage}>
                <span style={styles.mileageIcon}>🔢</span>
                <span>Detected Mileage: <strong>{photoAnalysis.detectedMileage}</strong></span>
              </div>
            )}
            
            {/* Issues Found */}
            {photoAnalysis.photoResults.some(pr => pr.issues.length > 0) && (
              <div style={styles.issuesSection}>
                <h4 style={styles.issuesTitle}>⚠️ Issues Detected</h4>
                {photoAnalysis.photoResults.map((pr) => (
                  pr.issues.map((issue, idx) => (
                    <div key={`${pr.photoId}-${idx}`} style={styles.issueItem}>
                      <span style={{
                        ...styles.severityBadge,
                        background: issue.severity === 'minor' ? 'rgba(251, 191, 36, 0.2)' :
                                   issue.severity === 'moderate' ? 'rgba(251, 146, 60, 0.2)' :
                                   'rgba(248, 113, 113, 0.2)',
                        color: issue.severity === 'minor' ? '#fbbf24' :
                               issue.severity === 'moderate' ? '#fb923c' :
                               '#f87171',
                      }}>
                        {issue.severity}
                      </span>
                      <span style={styles.issueLocation}>{issue.location}:</span>
                      <span style={styles.issueDesc}>{issue.description}</span>
                      {issue.estimatedImpact && (
                        <span style={styles.issueImpact}>{issue.estimatedImpact}</span>
                      )}
                    </div>
                  ))
                ))}
              </div>
            )}
            
            {/* Positives */}
            {photoAnalysis.photoResults.some(pr => pr.positives.length > 0) && (
              <div style={styles.positivesSection}>
                <h4 style={styles.positivesTitle}>✓ Positive Observations</h4>
                {photoAnalysis.photoResults.flatMap(pr => pr.positives).slice(0, 5).map((positive, idx) => (
                  <div key={idx} style={styles.positiveItem}>• {positive}</div>
                ))}
              </div>
            )}
            
            {/* Recommendations */}
            {photoAnalysis.recommendations.length > 0 && (
              <div style={styles.recommendationsSection}>
                <h4 style={styles.recommendationsTitle}>💡 Recommendations</h4>
                {photoAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} style={styles.recommendationItem}>• {rec}</div>
                ))}
              </div>
            )}
            
            <div style={styles.analysisFooter}>
              <span style={styles.confidenceLabel}>
                Confidence: {photoAnalysis.confidenceLevel}
              </span>
              <span style={styles.adjustmentLabel}>
                Est. Adjustment: {photoAnalysis.estimatedConditionAdjustment}
              </span>
            </div>
            
            <button
              style={styles.reanalyzeButton}
              onClick={() => { setPhotoAnalysis(null); setAnalysisError(null); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Re-analyze Photos
            </button>
          </div>
        )}
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      <button
        style={{ ...styles.continueButton, opacity: canProceedStep4 ? 1 : 0.5 }}
        onClick={calculateEstimate}
        disabled={!canProceedStep4 || isCalculating}
      >
        {isCalculating ? (
          <>
            <div style={styles.spinner} />
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const renderStep5 = () => {
    const equity = getEquity();

    return (
      <div style={styles.stepContent}>
        <div style={styles.estimateCard}>
          <div style={styles.estimateHeader}>
            <span style={styles.estimateEmoji}>🎉</span>
            <div>
              <h3 style={styles.estimateVehicle}>Your Trade-In Estimate</h3>
              <p style={styles.estimateMiles}>
                {tradeData.year} {tradeData.make} {tradeData.model} • {parseInt(tradeData.mileage.replace(/,/g, '')).toLocaleString()} miles
              </p>
            </div>
          </div>

          <div style={styles.estimateValueSection}>
            <div style={styles.estimateRange}>
              <span style={styles.rangeLow}>{formatCurrency(estimate?.low || 0)}</span>
              <span style={styles.rangeMid}>{formatCurrency(estimate?.mid || 0)}</span>
              <span style={styles.rangeHigh}>{formatCurrency(estimate?.high || 0)}</span>
            </div>
            <div style={styles.rangeBar}>
              <div style={styles.rangeBarFill} />
              <div style={styles.rangeMarker} />
            </div>
            <div style={styles.rangeLabels}>
              <span>Low</span>
              <span>Market Average</span>
              <span>High</span>
            </div>
          </div>

          {/* Equity Summary (if has payoff) */}
          {tradeData.hasPayoff && equity !== null && (
            <div style={styles.equitySummary}>
              <div style={styles.equityRow}>
                <span>Trade Value</span>
                <span style={styles.equityValue}>{formatCurrency(estimate?.mid || 0)}</span>
              </div>
              <div style={styles.equityRow}>
                <span>Payoff Amount</span>
                <span style={{ ...styles.equityValue, color: '#f87171' }}>
                  -{formatCurrency(parseFloat(tradeData.payoffAmount.replace(/,/g, '')) || 0)}
                </span>
              </div>
              <div style={styles.equityDivider} />
              <div style={styles.equityRow}>
                <span style={{ fontWeight: '700' }}>Your Equity</span>
                <span style={{ 
                  ...styles.equityValue, 
                  fontSize: '24px',
                  color: equity >= 0 ? '#4ade80' : '#f87171',
                }}>
                  {equity >= 0 ? '+' : ''}{formatCurrency(equity)}
                </span>
              </div>
            </div>
          )}

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
            Apply to Payment Calculator
          </button>

          <button style={styles.secondaryButton} onClick={handleRequestAppraisal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Request In-Person Appraisal
          </button>
        </div>

        <button style={styles.startOverLink} onClick={() => { setStep(1); setEstimate(null); }}>
          Start Over with Different Vehicle
        </button>
      </div>
    );
  };

  // ============================================================================
  // Progress Indicator
  // ============================================================================

  const activeSteps = getActiveSteps();

  const renderProgress = () => (
    <div style={styles.progress}>
      {activeSteps.map((s, idx) => {
        const stepLabels = ['Vehicle', 'Ownership', 'Payoff', 'Condition', 'Estimate'];
        const isActive = step === s;
        const isComplete = step > s;

        return (
          <React.Fragment key={s}>
            <div style={styles.progressStep}>
              <div style={{
                ...styles.progressDot,
                background: isActive || isComplete ? '#1B7340' : 'rgba(255,255,255,0.2)',
              }}>
                {isComplete ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : idx + 1}
              </div>
              {!isMobile && <span style={styles.progressLabel}>{stepLabels[s - 1]}</span>}
            </div>
            {idx < activeSteps.length - 1 && (
              <div style={{
                ...styles.progressLine,
                background: step > s ? '#1B7340' : 'rgba(255,255,255,0.2)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Back to Vehicle Button */}
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
      {renderProgress()}

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: { [key: string]: CSSProperties } = {
  container: {
    flex: 1,
    padding: '24px 20px',
    overflow: 'auto',
    maxWidth: '700px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    fontWeight: 600,
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
    fontSize: '28px',
    fontWeight: 700,
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
    gap: '0',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  progressDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    flexShrink: 0,
  },
  progressLine: {
    width: '40px',
    height: '3px',
    borderRadius: '2px',
    flexShrink: 0,
    margin: '0 4px',
  },
  progressLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 24px 0',
    textAlign: 'center',
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  select: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  vinSection: {
    padding: '16px',
    background: 'rgba(27, 115, 64, 0.1)',
    border: '1px solid rgba(27, 115, 64, 0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  vinHeader: {
    marginBottom: '12px',
  },
  vinIconLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  vinLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
  },
  vinHint: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  vinInputWrapper: {
    position: 'relative',
  },
  vinInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    outline: 'none',
    boxSizing: 'border-box',
  },
  vinSpinner: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '16px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
  },
  currencyInputWrapper: {
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '15px',
    zIndex: 1,
  },
  currencySuffix: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
  },
  inputHint: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
  ownershipGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  ownershipCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'center',
  },
  ownershipIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  ownershipLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px',
  },
  ownershipDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  checkBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#1B7340',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
  },
  conditionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  conditionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'center',
  },
  conditionIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  conditionLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '2px',
  },
  conditionDesc: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
  },
  conditionCheck: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#1B7340',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
  },
  photoSection: {
    marginBottom: '24px',
  },
  photoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  photoHint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '12px',
  },
  photoSpot: {
    aspectRatio: '1',
    borderRadius: '12px',
    border: '2px dashed rgba(255,255,255,0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.02)',
    position: 'relative',
    overflow: 'hidden',
  },
  photoIcon: {
    fontSize: '24px',
  },
  photoLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
  },
  photoRemove: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
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
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
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
    textAlign: 'left',
  },
  estimateEmoji: {
    fontSize: '48px',
  },
  estimateVehicle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  estimateMiles: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    margin: '4px 0 0 0',
  },
  estimateValueSection: {
    marginBottom: '20px',
  },
  estimateRange: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  },
  rangeLow: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
  },
  rangeMid: {
    fontSize: '40px',
    fontWeight: 700,
    color: '#4ade80',
  },
  rangeHigh: {
    fontSize: '16px',
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
  equitySummary: {
    padding: '16px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  equityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
  },
  equityValue: {
    fontWeight: 700,
    color: '#ffffff',
  },
  equityDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '12px 0',
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
    fontWeight: 700,
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
    fontWeight: 600,
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
    width: '100%',
  },
  
  // Photo Analysis Styles
  analyzeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 20px',
    marginTop: '16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  analysisError: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '13px',
  },
  analysisResults: {
    marginTop: '20px',
    padding: '20px',
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '16px',
  },
  analysisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  analysisTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
  },
  conditionBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  analysisSummary: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  detectedMileage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '16px',
  },
  mileageIcon: {
    fontSize: '16px',
  },
  issuesSection: {
    marginBottom: '16px',
  },
  issuesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fbbf24',
    marginBottom: '10px',
  },
  issueItem: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '13px',
  },
  severityBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  issueLocation: {
    fontWeight: 600,
    color: 'rgba(255,255,255,0.9)',
  },
  issueDesc: {
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  issueImpact: {
    color: '#f87171',
    fontSize: '12px',
    fontWeight: 500,
  },
  positivesSection: {
    marginBottom: '16px',
  },
  positivesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#4ade80',
    marginBottom: '10px',
  },
  positiveItem: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '6px',
    paddingLeft: '4px',
  },
  recommendationsSection: {
    marginBottom: '16px',
  },
  recommendationsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#60a5fa',
    marginBottom: '10px',
  },
  recommendationItem: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '6px',
    paddingLeft: '4px',
  },
  analysisFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '12px',
  },
  confidenceLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
  },
  adjustmentLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  reanalyzeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default TradeInEstimator;
