import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import api from './api';

// Types
interface TradeData {
  year: string; make: string; model: string; trim: string; mileage: string; vin: string;
  hasPayoff: boolean | null; payoffAmount: string; monthlyPayment: string; financedWith: string;
  condition: string; photos: PhotoData[]; registrationPhoto: PhotoData | null;
}
interface PhotoData { id: string; file: File | null; preview: string | null; }
interface EstimateResult { low: number; mid: number; high: number; source?: string; }
interface TradeInEstimatorProps {
  navigateTo: (page: string) => void;
  updateCustomerData: (data: any) => void;
  customerData?: any;
}

// Constants
const YEARS = Array.from({ length: 15 }, (_, i) => 2025 - i);
const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', desc: 'Like new, no visible wear', icon: '✨', multiplier: 1.05 },
  { value: 'good', label: 'Good', desc: 'Minor wear, well maintained', icon: '👍', multiplier: 1.0 },
  { value: 'fair', label: 'Fair', desc: 'Normal wear for age/miles', icon: '👌', multiplier: 0.9 },
  { value: 'poor', label: 'Poor', desc: 'Significant wear or damage', icon: '⚠️', multiplier: 0.75 },
];
const PHOTO_SPOTS = [
  { id: 'front', label: 'Front', icon: '🚗' }, { id: 'rear', label: 'Rear', icon: '🔙' },
  { id: 'interior', label: 'Interior', icon: '🪑' }, { id: 'odometer', label: 'Odometer', icon: '🔢' },
  { id: 'damage', label: 'Damage', icon: '📸' },
];
const LENDERS = [
  'Toyota Financial Services', 'Honda Financial Services', 'GM Financial', 'Ford Credit',
  'Chase Auto', 'Capital One Auto', 'Ally Financial', 'Bank of America', 'Wells Fargo Auto', 'Credit Union', 'Other',
];
const FALLBACK_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC',
  'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
  'Nissan', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];
const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/gi;

// Tesseract OCR
let tesseractWorker: any = null;
const loadTesseract = async (): Promise<boolean> => {
  if (tesseractWorker) return true;
  try {
    if ((window as any).Tesseract) {
      tesseractWorker = await (window as any).Tesseract.createWorker('eng');
      return true;
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = async () => {
        try {
          tesseractWorker = await (window as any).Tesseract.createWorker('eng');
          resolve(true);
        } catch { resolve(false); }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  } catch { return false; }
};

const extractVinFromImage = async (imageData: string): Promise<string | null> => {
  try {
    if (!(await loadTesseract()) || !tesseractWorker) return null;
    const result = await tesseractWorker.recognize(imageData);
    const matches = result.data.text.toUpperCase().replace(/\s/g, '').match(VIN_REGEX);
    return matches?.[0] || null;
  } catch { return null; }
};

// Component
const TradeInEstimator: React.FC<TradeInEstimatorProps> = ({ navigateTo, updateCustomerData, customerData }) => {
  const [step, setStep] = useState(1);
  const [tradeData, setTradeData] = useState<TradeData>({
    year: '', make: '', model: '', trim: '', mileage: '', vin: '',
    hasPayoff: null, payoffAmount: '', monthlyPayment: '', financedWith: '',
    condition: '', photos: PHOTO_SPOTS.map(s => ({ id: s.id, file: null, preview: null })),
    registrationPhoto: null,
  });
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const registrationInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  useEffect(() => {
    api.getMakes().then(r => setMakes(r || FALLBACK_MAKES)).catch(() => setMakes(FALLBACK_MAKES));
  }, []);

  useEffect(() => {
    if (!tradeData.make) { setModels([]); return; }
    api.getModels(tradeData.make).then(r => setModels(r || [])).catch(() => setModels([]));
  }, [tradeData.make]);

  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    setShowScanner(true);
    setScanStatus('Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanStatus('Position registration document in frame');
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError' ? 'Camera access denied. Please allow camera access and try again.'
        : err.name === 'NotFoundError' ? 'No camera found on this device.'
        : 'Unable to access camera. Please try uploading a photo instead.'
      );
      setScanStatus('');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
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
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      const blob = await (await fetch(imageData)).blob();
      const file = new File([blob], 'registration.jpg', { type: 'image/jpeg' });
      setTradeData(prev => ({ ...prev, registrationPhoto: { id: 'registration', file, preview: imageData } }));
      setScanStatus('Scanning for VIN...');
      const extractedVin = await extractVinFromImage(imageData);
      if (extractedVin) {
        setScanStatus(`Found VIN: ${extractedVin}`);
        setTradeData(prev => ({ ...prev, vin: extractedVin }));
        setTimeout(() => handleVinDecode(extractedVin), 500);
        setTimeout(stopCamera, 1500);
      } else {
        setScanStatus('VIN not detected. Photo saved - enter VIN manually.');
        setTimeout(stopCamera, 2000);
      }
    } catch { setScanStatus('Error capturing image. Please try again.'); }
    finally { setIsScanning(false); }
  };

  const handleRegistrationUpload = async (file: File) => {
    setIsScanning(true);
    setScanStatus('Processing image...');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setTradeData(prev => ({ ...prev, registrationPhoto: { id: 'registration', file, preview: imageData } }));
      setScanStatus('Scanning for VIN...');
      const extractedVin = await extractVinFromImage(imageData);
      if (extractedVin) {
        setScanStatus(`Found VIN: ${extractedVin}`);
        setTradeData(prev => ({ ...prev, vin: extractedVin }));
        setTimeout(() => handleVinDecode(extractedVin), 500);
      } else {
        setScanStatus('VIN not detected. Enter VIN manually.');
      }
      setIsScanning(false);
      setTimeout(() => setScanStatus(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Handlers
  const handleInputChange = (field: keyof TradeData, value: any) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
    setError(null);
    if (field === 'make') setTradeData(prev => ({ ...prev, [field]: value, model: '', trim: '' }));
  };

  const handleVinDecode = async (vinToUse?: string) => {
    const vin = vinToUse || tradeData.vin;
    if (vin.length !== 17) return;
    setIsDecodingVin(true);
    try {
      const decoded = await api.decodeTradeInVin(vin);
      if (decoded) {
        setTradeData(prev => ({
          ...prev, vin,
          year: decoded.year?.toString() || prev.year,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          trim: decoded.trim || prev.trim,
        }));
      }
    } catch {}
    finally { setIsDecodingVin(false); }
  };

  const handlePhotoUpload = (spotId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTradeData(prev => ({
        ...prev,
        photos: prev.photos.map(p => p.id === spotId ? { ...p, file, preview: e.target?.result as string } : p),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (spotId: string) => {
    setTradeData(prev => ({
      ...prev,
      photos: prev.photos.map(p => p.id === spotId ? { ...p, file: null, preview: null } : p),
    }));
  };

  const calculateEstimate = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await api.getTradeInEstimate({
        year: parseInt(tradeData.year), make: tradeData.make, model: tradeData.model,
        trim: tradeData.trim, mileage: parseInt(tradeData.mileage.replace(/,/g, '')),
        condition: tradeData.condition, vin: tradeData.vin,
      });
      setEstimate(result);
      setStep(5);
    } catch { setError('Unable to calculate estimate. Please try again.'); }
    finally { setIsCalculating(false); }
  };

  const buildTradeInData = (extra = {}) => ({
    hasTrade: true,
    vehicle: {
      year: tradeData.year, make: tradeData.make, model: tradeData.model, trim: tradeData.trim,
      mileage: parseInt(tradeData.mileage.replace(/,/g, '')), vin: tradeData.vin, condition: tradeData.condition,
    },
    hasPayoff: tradeData.hasPayoff,
    payoffAmount: tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : null,
    monthlyPayment: tradeData.hasPayoff ? parseFloat(tradeData.monthlyPayment.replace(/,/g, '')) : null,
    financedWith: tradeData.hasPayoff ? tradeData.financedWith : null,
    estimatedValue: estimate?.mid || 0,
    estimateRange: estimate,
    equity: estimate?.mid ? estimate.mid - (tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : 0) : null,
    photosUploaded: tradeData.photos.filter(p => p.file).length,
    registrationPhoto: tradeData.registrationPhoto?.preview || null,
    ...extra,
  });

  const handleApplyTrade = () => {
    updateCustomerData({ tradeIn: buildTradeInData() });
    navigateTo('paymentCalculator');
  };

  const handleRequestAppraisal = async () => {
    try {
      await api.requestAppraisal({
        year: parseInt(tradeData.year), make: tradeData.make, model: tradeData.model, trim: tradeData.trim,
        mileage: parseInt(tradeData.mileage.replace(/,/g, '')), condition: tradeData.condition, vin: tradeData.vin,
        hasPayoff: tradeData.hasPayoff,
        payoffAmount: tradeData.hasPayoff ? parseFloat(tradeData.payoffAmount.replace(/,/g, '')) : null,
        financedWith: tradeData.financedWith,
      });
      updateCustomerData({ tradeIn: buildTradeInData({ requestedAppraisal: true }) });
      navigateTo('handoff');
    } catch { setError('Unable to request appraisal. Please try again.'); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  const formatMileage = (v: string) => { const n = v.replace(/,/g, '').replace(/\D/g, ''); return n ? parseInt(n).toLocaleString() : ''; };
  const getEquity = () => {
    if (!estimate?.mid || !tradeData.hasPayoff) return null;
    return estimate.mid - (parseFloat(tradeData.payoffAmount.replace(/,/g, '')) || 0);
  };
  const getActiveSteps = () => tradeData.hasPayoff === false ? [1, 2, 4, 5] : [1, 2, 3, 4, 5];

  const canProceedStep1 = tradeData.year && tradeData.make && tradeData.model && tradeData.mileage;
  const canProceedStep2 = tradeData.hasPayoff !== null;
  const canProceedStep3 = !tradeData.hasPayoff || (tradeData.payoffAmount && tradeData.financedWith);
  const canProceedStep4 = tradeData.condition;

  // Render helpers
  const BackLink = ({ to }: { to: number }) => (
    <button style={s.backLink} onClick={() => setStep(to)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Back
    </button>
  );

  const ContinueButton = ({ onClick, disabled, loading, text = 'Continue' }: any) => (
    <button style={{ ...s.continueBtn, opacity: disabled ? 0.5 : 1 }} onClick={onClick} disabled={disabled}>
      {loading ? <><div style={s.spinner} />Calculating...</> : <>{text}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
    </button>
  );

  // Scanner Modal
  const renderScanner = () => !showScanner ? null : (
    <div style={s.scannerOverlay}>
      <div style={s.scannerModal}>
        <div style={s.scannerHeader}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Scan Registration</h3>
          <button style={s.scannerClose} onClick={stopCamera}>✕</button>
        </div>
        {cameraError ? (
          <div style={s.scannerError}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>📷</span>
            <p>{cameraError}</p>
            <button style={s.uploadFallback} onClick={() => { stopCamera(); registrationInputRef.current?.click(); }}>Upload Photo Instead</button>
          </div>
        ) : (
          <>
            <div style={s.scannerVideoWrap}>
              <video ref={videoRef} style={s.scannerVideo} autoPlay playsInline muted />
              <div style={s.scannerFrame}>
                {[{}, { right: 0, left: 'auto' }, { bottom: 0, top: 'auto' }, { bottom: 0, right: 0, top: 'auto', left: 'auto' }].map((pos, i) => (
                  <div key={i} style={{ ...s.scannerCorner, ...pos }} />
                ))}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div style={s.scannerStatus}>
              {isScanning ? <div style={s.scanningInd}><div style={s.spinner} /><span>{scanStatus}</span></div> : <span>{scanStatus}</span>}
            </div>
            <div style={{ padding: '16px 20px 20px' }}>
              <button style={s.captureBtn} onClick={captureAndScan} disabled={isScanning}>
                <span style={{ fontSize: '24px' }}>📸</span>Capture & Scan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Step renders
  const renderStep1 = () => (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Tell us about your vehicle</h2>
      <p style={s.stepSubtitle}>Enter details or scan your VIN for instant lookup</p>
      <div style={s.vinSection}>
        <div style={s.vinHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={s.cameraBtn} onClick={startCamera} title="Scan Registration">📷</button>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#fff' }}>Quick VIN Scan</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Tap camera to scan registration</span>
            </div>
          </div>
          {!tradeData.registrationPhoto && <button style={s.uploadBtn} onClick={() => registrationInputRef.current?.click()}>Upload</button>}
        </div>
        {tradeData.registrationPhoto?.preview && (
          <div style={s.regPreview}>
            <img src={tradeData.registrationPhoto.preview} alt="Registration" style={s.regImage} />
            <button style={s.regRemove} onClick={() => setTradeData(prev => ({ ...prev, registrationPhoto: null }))}>✕</button>
            <span style={s.regLabel}>✓ Registration saved</span>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <input type="text" style={s.vinInput} placeholder="Enter 17-character VIN" value={tradeData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())} onBlur={() => handleVinDecode()} maxLength={17} />
          {isDecodingVin && <div style={s.vinSpinner}><div style={s.spinner} /></div>}
        </div>
        {scanStatus && !showScanner && <div style={s.scanStatusMsg}>{isScanning && <div style={s.spinnerSm} />}{scanStatus}</div>}
        <input ref={registrationInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRegistrationUpload(f); }} />
      </div>
      <div style={s.divider}><span style={s.dividerText}>or enter manually</span></div>
      <div style={s.formGrid}>
        <div style={s.formGroup}>
          <label style={s.label}>Year *</label>
          <select style={s.select} value={tradeData.year} onChange={(e) => handleInputChange('year', e.target.value)}>
            <option value="">Select Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Make *</label>
          <select style={s.select} value={tradeData.make} onChange={(e) => handleInputChange('make', e.target.value)}>
            <option value="">Select Make</option>
            {makes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Model *</label>
          <select style={s.select} value={tradeData.model} onChange={(e) => handleInputChange('model', e.target.value)} disabled={!tradeData.make}>
            <option value="">Select Model</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Trim</label>
          <input type="text" style={s.input} placeholder="e.g., EX-L, Sport" value={tradeData.trim} onChange={(e) => handleInputChange('trim', e.target.value)} />
        </div>
        <div style={{ ...s.formGroup, ...(isMobile ? {} : { gridColumn: '1 / -1' }) }}>
          <label style={s.label}>Current Mileage *</label>
          <input type="text" style={s.input} placeholder="e.g., 45,000" value={tradeData.mileage} onChange={(e) => handleInputChange('mileage', formatMileage(e.target.value))} />
        </div>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <ContinueButton onClick={() => setStep(2)} disabled={!canProceedStep1} />
      {renderScanner()}
    </div>
  );

  const renderStep2 = () => (
    <div style={s.stepContent}>
      <BackLink to={1} />
      <h2 style={s.stepTitle}>Do you owe money on this vehicle?</h2>
      <p style={s.stepSubtitle}>{tradeData.year} {tradeData.make} {tradeData.model}</p>
      <div style={s.ownershipGrid}>
        {[{ val: true, icon: '🏦', label: 'Yes, I still owe', desc: 'I have a loan or lease' },
          { val: false, icon: '✅', label: 'No, I own it outright', desc: "It's paid off" }].map(opt => (
          <button key={String(opt.val)} style={{
            ...s.ownershipCard,
            borderColor: tradeData.hasPayoff === opt.val ? '#1B7340' : 'rgba(255,255,255,0.1)',
            background: tradeData.hasPayoff === opt.val ? 'rgba(27,115,64,0.15)' : 'rgba(255,255,255,0.02)',
          }} onClick={() => handleInputChange('hasPayoff', opt.val)}>
            <span style={{ fontSize: '40px', marginBottom: '12px' }}>{opt.icon}</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{opt.label}</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</span>
            {tradeData.hasPayoff === opt.val && <div style={s.checkBadge}>✓</div>}
          </button>
        ))}
      </div>
      <ContinueButton onClick={() => setStep(tradeData.hasPayoff ? 3 : 4)} disabled={!canProceedStep2} />
    </div>
  );

  const renderStep3 = () => (
    <div style={s.stepContent}>
      <BackLink to={2} />
      <h2 style={s.stepTitle}>Tell us about your payoff</h2>
      <p style={s.stepSubtitle}>This helps us calculate your true equity</p>
      <div style={{ ...s.formGrid, gridTemplateColumns: '1fr' }}>
        <div style={s.formGroup}>
          <label style={s.label}>Approximate Payoff Amount *</label>
          <div style={{ position: 'relative' }}>
            <span style={s.currencySymbol}>$</span>
            <input type="text" style={{ ...s.input, paddingLeft: '32px' }} placeholder="e.g., 15,000"
              value={tradeData.payoffAmount} onChange={(e) => handleInputChange('payoffAmount', formatMileage(e.target.value))} />
          </div>
          <span style={s.inputHint}>💡 Check your lender's app or latest statement</span>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Current Monthly Payment</label>
          <div style={{ position: 'relative' }}>
            <span style={s.currencySymbol}>$</span>
            <input type="text" style={{ ...s.input, paddingLeft: '32px' }} placeholder="e.g., 450"
              value={tradeData.monthlyPayment} onChange={(e) => handleInputChange('monthlyPayment', formatMileage(e.target.value))} />
            <span style={s.currencySuffix}>/mo</span>
          </div>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Financed With *</label>
          <select style={s.select} value={tradeData.financedWith} onChange={(e) => handleInputChange('financedWith', e.target.value)}>
            <option value="">Select lender...</option>
            {LENDERS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <ContinueButton onClick={() => setStep(4)} disabled={!canProceedStep3} />
    </div>
  );

  const renderStep4 = () => (
    <div style={s.stepContent}>
      <BackLink to={tradeData.hasPayoff ? 3 : 2} />
      <h2 style={s.stepTitle}>Vehicle Condition</h2>
      <p style={s.stepSubtitle}>Be honest — it helps us give you an accurate estimate</p>
      <div style={s.conditionGrid}>
        {CONDITIONS.map(c => (
          <button key={c.value} style={{
            ...s.conditionCard,
            borderColor: tradeData.condition === c.value ? '#1B7340' : 'rgba(255,255,255,0.1)',
            background: tradeData.condition === c.value ? 'rgba(27,115,64,0.15)' : 'rgba(255,255,255,0.02)',
          }} onClick={() => handleInputChange('condition', c.value)}>
            <span style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{c.label}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{c.desc}</span>
            {tradeData.condition === c.value && <div style={s.conditionCheck}>✓</div>}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={s.label}>Photos (Optional)</label>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Speeds up appraisal</span>
        </div>
        <div style={s.photoGrid}>
          {PHOTO_SPOTS.map(spot => {
            const photo = tradeData.photos.find(p => p.id === spot.id);
            return (
              <div key={spot.id} style={{ ...s.photoSpot, backgroundImage: photo?.preview ? `url(${photo.preview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                onClick={() => fileInputRefs.current[spot.id]?.click()}>
                {!photo?.preview && <><span style={{ fontSize: '24px' }}>{spot.icon}</span><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{spot.label}</span></>}
                {photo?.preview && <button style={s.photoRemove} onClick={(e) => { e.stopPropagation(); handleRemovePhoto(spot.id); }}>✕</button>}
                <input ref={el => { fileInputRefs.current[spot.id] = el; }} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(spot.id, f); }} />
              </div>
            );
          })}
        </div>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <ContinueButton onClick={calculateEstimate} disabled={!canProceedStep4 || isCalculating} loading={isCalculating} text="Get My Estimate" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const renderStep5 = () => {
    const equity = getEquity();
    return (
      <div style={s.stepContent}>
        <div style={s.estimateCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Your Trade-In Estimate</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                {tradeData.year} {tradeData.make} {tradeData.model} • {parseInt(tradeData.mileage.replace(/,/g, '')).toLocaleString()} miles
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(estimate?.low || 0)}</span>
              <span style={{ fontSize: '40px', fontWeight: 700, color: '#4ade80' }}>{formatCurrency(estimate?.mid || 0)}</span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(estimate?.high || 0)}</span>
            </div>
            <div style={s.rangeBar}><div style={s.rangeBarFill} /><div style={s.rangeMarker} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <span>Low</span><span>Market Average</span><span>High</span>
            </div>
          </div>
          {tradeData.hasPayoff && equity !== null && (
            <div style={s.equitySummary}>
              <div style={s.equityRow}><span>Trade Value</span><span style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(estimate?.mid || 0)}</span></div>
              <div style={s.equityRow}><span>Payoff Amount</span><span style={{ fontWeight: 700, color: '#f87171' }}>-{formatCurrency(parseFloat(tradeData.payoffAmount.replace(/,/g, '')) || 0)}</span></div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
              <div style={s.equityRow}>
                <span style={{ fontWeight: 700 }}>Your Equity</span>
                <span style={{ fontWeight: 700, fontSize: '24px', color: equity >= 0 ? '#4ade80' : '#f87171' }}>{equity >= 0 ? '+' : ''}{formatCurrency(equity)}</span>
              </div>
            </div>
          )}
          {tradeData.registrationPhoto?.preview && (
            <div style={s.regSaved}><span>📄</span><span>Registration photo saved to customer file</span></div>
          )}
          <div style={s.disclaimer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            This is an estimate. Final value determined by in-person appraisal.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <button style={s.primaryBtn} onClick={handleApplyTrade}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>
            Apply to Payment Calculator
          </button>
          <button style={s.secondaryBtn} onClick={handleRequestAppraisal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Request In-Person Appraisal
          </button>
        </div>
        <button style={s.startOver} onClick={() => { setStep(1); setEstimate(null); }}>Start Over with Different Vehicle</button>
      </div>
    );
  };

  // Progress indicator
  const activeSteps = getActiveSteps();
  const stepLabels = ['Vehicle', 'Ownership', 'Payoff', 'Condition', 'Estimate'];
  const renderProgress = () => (
    <div style={s.progress}>
      {activeSteps.map((st, idx) => (
        <React.Fragment key={st}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ ...s.progressDot, background: step >= st ? '#1B7340' : 'rgba(255,255,255,0.2)' }}>
              {step > st ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : idx + 1}
            </div>
            {!isMobile && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{stepLabels[st - 1]}</span>}
          </div>
          {idx < activeSteps.length - 1 && <div style={{ ...s.progressLine, background: step > st ? '#1B7340' : 'rgba(255,255,255,0.2)' }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={s.container}>
      <button style={s.backBtn} onClick={() => navigateTo('vehicleDetail')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Vehicle
      </button>
      <div style={s.header}>
        <div style={s.headerIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Trade-In Estimator</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Get an instant estimate for your current vehicle</p>
      </div>
      {renderProgress()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
};

// Styles
const base = { box: 'border-box' as const };
const s: { [k: string]: CSSProperties } = {
  container: { flex: 1, padding: '24px 20px', overflow: 'auto', maxWidth: '700px', margin: '0 auto', boxSizing: base.box },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '24px', padding: 0 },
  header: { textAlign: 'center', marginBottom: '24px' },
  headerIcon: { width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 16px' },
  progress: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' },
  progressDot: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#fff', flexShrink: 0 },
  progressLine: { width: '40px', height: '3px', borderRadius: '2px', margin: '0 4px' },
  stepContent: { display: 'flex', flexDirection: 'column' },
  stepTitle: { fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px', textAlign: 'center' },
  stepSubtitle: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', textAlign: 'center' },
  backLink: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0, alignSelf: 'flex-start' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  input: { padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: base.box, width: '100%' },
  select: { padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', cursor: 'pointer', outline: 'none', boxSizing: base.box, width: '100%' },
  vinSection: { padding: '16px', background: 'rgba(27,115,64,0.1)', border: '1px solid rgba(27,115,64,0.3)', borderRadius: '12px', marginBottom: '16px' },
  vinHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cameraBtn: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  vinInput: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', outline: 'none', boxSizing: base.box },
  vinSpinner: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' },
  scanStatusMsg: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' },
  regPreview: { position: 'relative', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' },
  regImage: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' },
  regRemove: { position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  regLabel: { position: 'absolute', bottom: '8px', left: '8px', padding: '4px 8px', background: 'rgba(27,115,64,0.9)', borderRadius: '4px', fontSize: '11px', color: '#fff', fontWeight: 600 },
  regSaved: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(27,115,64,0.15)', borderRadius: '8px', fontSize: '13px', color: '#4ade80', marginBottom: '16px' },
  divider: { display: 'flex', alignItems: 'center', margin: '16px 0' },
  dividerText: { flex: 1, textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.4)' },
  currencySymbol: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '15px', zIndex: 1 },
  currencySuffix: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '13px' },
  inputHint: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
  ownershipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  ownershipCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', borderRadius: '16px', border: '2px solid', cursor: 'pointer', position: 'relative', textAlign: 'center' },
  checkBadge: { position: 'absolute', top: '12px', right: '12px', width: '24px', height: '24px', borderRadius: '50%', background: '#1B7340', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 },
  conditionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' },
  conditionCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', position: 'relative', textAlign: 'center' },
  conditionCheck: { position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: '#1B7340', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' },
  photoSpot: { aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' },
  photoRemove: { position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' },
  continueBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px 24px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', width: '100%' },
  spinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  spinnerSm: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  error: { padding: '12px 16px', background: 'rgba(220,38,38,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', marginBottom: '16px', textAlign: 'center' },
  scannerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  scannerModal: { width: '100%', maxWidth: '500px', background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' },
  scannerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  scannerClose: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scannerVideoWrap: { position: 'relative', background: '#000', aspectRatio: '4/3' },
  scannerVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  scannerFrame: { position: 'absolute', top: '15%', left: '10%', right: '10%', bottom: '15%', border: '2px solid rgba(27,115,64,0.5)', borderRadius: '8px' },
  scannerCorner: { position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderTop: '3px solid #1B7340', borderLeft: '3px solid #1B7340', borderTopLeftRadius: '8px' },
  scannerStatus: { padding: '12px 20px', textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.7)', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scanningInd: { display: 'flex', alignItems: 'center', gap: '10px' },
  captureBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px 24px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer' },
  scannerError: { padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  uploadFallback: { marginTop: '16px', padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  estimateCard: { padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '24px' },
  rangeBar: { height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative', marginBottom: '8px' },
  rangeBarFill: { position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(74,222,128,0.3) 0%, #4ade80 50%, rgba(74,222,128,0.3) 100%)', borderRadius: '4px' },
  rangeMarker: { position: 'absolute', left: '50%', top: '-4px', width: '16px', height: '16px', background: '#4ade80', borderRadius: '50%', transform: 'translateX(-50%)', border: '3px solid #0a0a0a' },
  equitySummary: { padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '16px' },
  equityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' },
  disclaimer: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  primaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px 24px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  startOver: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', textAlign: 'center', padding: '8px', width: '100%' },
};

export default TradeInEstimator;
