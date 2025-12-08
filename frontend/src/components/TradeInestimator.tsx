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
 * - 📷 Camera VIN scanning from registration
 * - 📷 Registration photo capture and storage
 * 
 * @version 2.1.0
 */

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import api from './api';

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
  // Registration photo
  registrationPhoto: PhotoData | null;
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

// VIN validation regex - 17 characters, no I, O, Q
const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/gi;

// ============================================================================
// Tesseract.js Loader (for OCR)
// ============================================================================

let tesseractLoaded = false;
let tesseractWorker: any = null;

const loadTesseract = async (): Promise<boolean> => {
  if (tesseractLoaded && tesseractWorker) return true;
  
  try {
    // Check if Tesseract is already loaded
    if ((window as any).Tesseract) {
      const { createWorker } = (window as any).Tesseract;
      tesseractWorker = await createWorker('eng');
      tesseractLoaded = true;
      return true;
    }

    // Load Tesseract.js from CDN
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = async () => {
        try {
          const { createWorker } = (window as any).Tesseract;
          tesseractWorker = await createWorker('eng');
          tesseractLoaded = true;
          resolve(true);
        } catch (err) {
          console.error('Failed to initialize Tesseract worker:', err);
          resolve(false);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Tesseract.js');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  } catch (err) {
    console.error('Error loading Tesseract:', err);
    return false;
  }
};

const extractVinFromImage = async (imageData: string): Promise<string | null> => {
  try {
    const loaded = await loadTesseract();
    if (!loaded || !tesseractWorker) {
      console.warn('Tesseract not available, skipping OCR');
      return null;
    }

    const result = await tesseractWorker.recognize(imageData);
    const text = result.data.text.toUpperCase().replace(/\s/g, '');
    
    // Find VIN pattern in recognized text
    const matches = text.match(VIN_REGEX);
    if (matches && matches.length > 0) {
      // Return the first valid VIN found
      return matches[0];
    }
    
    return null;
  } catch (err) {
    console.error('OCR error:', err);
    return null;
  }
};

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
    registrationPhoto: null,
  });
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Refs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const registrationInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch makes on mount
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const result = await api.getMakes();
        setMakes(result.makes || FALLBACK_MAKES);
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
        setModels(result.models || []);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModels([]);
      }
    };
    fetchModels();
  }, [tradeData.make]);

  // ============================================================================
  // Camera & Scanner Functions
  // ============================================================================

  const startCamera = async () => {
    setCameraError(null);
    setShowScanner(true);
    setScanStatus('Starting camera...');

    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanStatus('Position registration document in frame');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Unable to access camera. Please try uploading a photo instead.'
      );
      setScanStatus('');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
    setScanStatus('');
    setCameraError(null);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setScanStatus('Capturing image...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Save registration photo
      const blob = await (await fetch(imageData)).blob();
      const file = new File([blob], 'registration.jpg', { type: 'image/jpeg' });
      
      setTradeData(prev => ({
        ...prev,
        registrationPhoto: {
          id: 'registration',
          file,
          preview: imageData,
        }
      }));

      setScanStatus('Scanning for VIN...');

      // Run OCR to extract VIN
      const extractedVin = await extractVinFromImage(imageData);

      if (extractedVin) {
        setScanStatus(`Found VIN: ${extractedVin}`);
        setTradeData(prev => ({ ...prev, vin: extractedVin }));
        
        // Also decode the VIN
        setTimeout(() => {
          handleVinDecode(extractedVin);
        }, 500);

        // Close scanner after short delay
        setTimeout(() => {
          stopCamera();
        }, 1500);
      } else {
        setScanStatus('VIN not detected. Photo saved - enter VIN manually.');
        setTimeout(() => {
          stopCamera();
        }, 2000);
      }
    } catch (err) {
      console.error('Capture error:', err);
      setScanStatus('Error capturing image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegistrationUpload = async (file: File) => {
    setIsScanning(true);
    setScanStatus('Processing image...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;

        // Save registration photo
        setTradeData(prev => ({
          ...prev,
          registrationPhoto: {
            id: 'registration',
            file,
            preview: imageData,
          }
        }));

        setScanStatus('Scanning for VIN...');

        // Run OCR to extract VIN
        const extractedVin = await extractVinFromImage(imageData);

        if (extractedVin) {
          setScanStatus(`Found VIN: ${extractedVin}`);
          setTradeData(prev => ({ ...prev, vin: extractedVin }));
          
          // Also decode the VIN
          setTimeout(() => {
            handleVinDecode(extractedVin);
          }, 500);
        } else {
          setScanStatus('VIN not detected. Enter VIN manually.');
        }

        setIsScanning(false);
        setTimeout(() => setScanStatus(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setScanStatus('Error processing image.');
      setIsScanning(false);
    }
  };

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

  const handleVinDecode = async (vinToUse?: string) => {
    const vin = vinToUse || tradeData.vin;
    if (vin.length !== 17) return;

    setIsDecodingVin(true);
    try {
      const decoded = await api.decodeTradeInVin(vin);
      if (decoded) {
        setTradeData(prev => ({
          ...prev,
          vin: vin,
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
  };

  const handleRemoveRegistration = () => {
    setTradeData(prev => ({
      ...prev,
      registrationPhoto: null,
    }));
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
        condition: tradeData.condition,
        vin: tradeData.vin,
      });

      setEstimate(result);
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
      registrationPhoto: tradeData.registrationPhoto?.preview || null,
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
        condition: tradeData.condition,
        vin: tradeData.vin,
        hasPayoff: tradeData.hasPayoff,
        payoffAmount: tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : null,
        financedWith: tradeData.financedWith,
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
        registrationPhoto: tradeData.registrationPhoto?.preview || null,
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
  // Scanner Modal
  // ============================================================================

  const renderScannerModal = () => {
    if (!showScanner) return null;

    return (
      <div style={styles.scannerOverlay}>
        <div style={styles.scannerModal}>
          <div style={styles.scannerHeader}>
            <h3 style={styles.scannerTitle}>Scan Registration</h3>
            <button style={styles.scannerClose} onClick={stopCamera}>✕</button>
          </div>

          {cameraError ? (
            <div style={styles.scannerError}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>📷</span>
              <p>{cameraError}</p>
              <button 
                style={styles.uploadFallbackButton}
                onClick={() => {
                  stopCamera();
                  registrationInputRef.current?.click();
                }}
              >
                Upload Photo Instead
              </button>
            </div>
          ) : (
            <>
              <div style={styles.scannerVideoContainer}>
                <video
                  ref={videoRef}
                  style={styles.scannerVideo}
                  autoPlay
                  playsInline
                  muted
                />
                <div style={styles.scannerFrame}>
                  <div style={styles.scannerCorner} />
                  <div style={{ ...styles.scannerCorner, right: 0, left: 'auto' }} />
                  <div style={{ ...styles.scannerCorner, bottom: 0, top: 'auto' }} />
                  <div style={{ ...styles.scannerCorner, bottom: 0, right: 0, top: 'auto', left: 'auto' }} />
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div style={styles.scannerStatus}>
                {isScanning ? (
                  <div style={styles.scanningIndicator}>
                    <div style={styles.spinner} />
                    <span>{scanStatus}</span>
                  </div>
                ) : (
                  <span>{scanStatus}</span>
                )}
              </div>

              <div style={styles.scannerActions}>
                <button
                  style={styles.captureButton}
                  onClick={captureAndScan}
                  disabled={isScanning}
                >
                  <span style={{ fontSize: '24px' }}>📸</span>
                  Capture & Scan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

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
            <button 
              style={styles.cameraButton}
              onClick={startCamera}
              title="Scan Registration"
            >
              📷
            </button>
            <div>
              <span style={styles.vinLabel}>Quick VIN Scan</span>
              <span style={styles.vinHint}>Tap camera to scan registration</span>
            </div>
          </div>
          {!tradeData.registrationPhoto && (
            <button 
              style={styles.uploadButton}
              onClick={() => registrationInputRef.current?.click()}
            >
              Upload
            </button>
          )}
        </div>

        {/* Registration Photo Preview */}
        {tradeData.registrationPhoto?.preview && (
          <div style={styles.registrationPreview}>
            <img 
              src={tradeData.registrationPhoto.preview} 
              alt="Registration" 
              style={styles.registrationImage}
            />
            <button 
              style={styles.registrationRemove}
              onClick={handleRemoveRegistration}
            >
              ✕
            </button>
            <span style={styles.registrationLabel}>✓ Registration saved</span>
          </div>
        )}

        <div style={styles.vinInputWrapper}>
          <input
            type="text"
            style={styles.vinInput}
            placeholder="Enter 17-character VIN"
            value={tradeData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
            onBlur={() => handleVinDecode()}
            maxLength={17}
          />
          {isDecodingVin && (
            <div style={styles.vinSpinner}>
              <div style={styles.spinner} />
            </div>
          )}
        </div>

        {/* Scan status message */}
        {scanStatus && !showScanner && (
          <div style={styles.scanStatusMessage}>
            {isScanning && <div style={styles.spinnerSmall} />}
            {scanStatus}
          </div>
        )}

        {/* Hidden file input for registration upload */}
        <input
          ref={registrationInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRegistrationUpload(file);
          }}
        />
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

      {/* Scanner Modal */}
      {renderScannerModal()}
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
          <label style={styles.label}>Photos (Optional)</label>
          <span style={styles.photoHint}>Speeds up appraisal</span>
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
                <span style={{ fontWeight: 700 }}>Your Equity</span>
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

          {/* Registration Photo Indicator */}
          {tradeData.registrationPhoto?.preview && (
            <div style={styles.registrationSaved}>
              <span>📄</span>
              <span>Registration photo saved to customer file</span>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  vinIconLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cameraButton: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
  },
  uploadButton: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
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
  scanStatusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
  },
  registrationPreview: {
    position: 'relative',
    marginBottom: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  registrationImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  registrationRemove: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  registrationLabel: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    padding: '4px 8px',
    background: 'rgba(27, 115, 64, 0.9)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#ffffff',
    fontWeight: 600,
  },
  registrationSaved: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(27, 115, 64, 0.15)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#4ade80',
    marginBottom: '16px',
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
  spinnerSmall: {
    width: '14px',
    height: '14px',
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
  // Scanner Modal Styles
  scannerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  scannerModal: {
    width: '100%',
    maxWidth: '500px',
    background: '#1a1a1a',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  scannerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  scannerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
  },
  scannerClose: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerVideoContainer: {
    position: 'relative',
    background: '#000',
    aspectRatio: '4/3',
  },
  scannerVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scannerFrame: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '15%',
    border: '2px solid rgba(27, 115, 64, 0.5)',
    borderRadius: '8px',
  },
  scannerCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '24px',
    height: '24px',
    borderTop: '3px solid #1B7340',
    borderLeft: '3px solid #1B7340',
    borderTopLeftRadius: '8px',
  },
  scannerStatus: {
    padding: '12px 20px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  scannerActions: {
    padding: '16px 20px 20px',
  },
  captureButton: {
    width: '100%',
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
  scannerError: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadFallbackButton: {
    marginTop: '16px',
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
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
};

export default TradeInEstimator;
