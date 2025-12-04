import React, { useState, CSSProperties } from 'react';
import type { Vehicle, KioskComponentProps } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface DetailedVehicle extends Vehicle {
  transmission?: string;
  fuelEconomy?: string;
  savings?: number;
  monthlyLease?: number;
  monthlyFinance?: number;
  mileage?: number;
  gradient?: string;
  rebates?: Array<{ name: string; amount: number }>;
}

interface TruckVINInfo {
  cabType: string;
  driveType: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Decode GM truck VIN to extract cab type and drive type (Silverado 1500/2500/3500) */
const decodeGMTruckVIN = (vin: string, model: string): TruckVINInfo | null => {
  if (!vin || vin.length !== 17) return null;
  
  const modelLower = (model || '').toLowerCase();
  if (!modelLower.includes('silverado')) return null;
  
  const vinUpper = vin.toUpperCase();
  const cabCode = vinUpper[5];
  const driveCode = vinUpper[6];
  
  let cabType = '';
  switch (cabCode) {
    case 'A': case 'B': cabType = 'Regular Cab'; break;
    case 'C': case 'D': cabType = 'Double Cab'; break;
    case 'K': case 'U': case 'G': cabType = 'Crew Cab'; break;
  }
  
  let driveType = '';
  switch (driveCode) {
    case 'E': case 'K': case 'G': case 'J': driveType = '4WD'; break;
    case 'A': case 'D': case 'C': case 'B': driveType = '2WD'; break;
  }
  
  return (cabType || driveType) ? { cabType, driveType } : null;
};

/** Map color descriptions to base color categories */
const getColorCategory = (colorDesc: string): string => {
  const c = colorDesc.toLowerCase();
  if (c.includes('black')) return 'black';
  if (c.includes('white') || c.includes('summit') || c.includes('arctic') || c.includes('polar')) return 'white';
  if (c.includes('red') || c.includes('cherry') || c.includes('cajun') || c.includes('radiant')) return 'red';
  if (c.includes('blue') || c.includes('northsky') || c.includes('glacier') || c.includes('reef')) return 'blue';
  if (c.includes('silver') || c.includes('sterling')) return 'silver';
  if (c.includes('gray') || c.includes('grey') || c.includes('shadow')) return 'gray';
  if (c.includes('green') || c.includes('woodland')) return 'green';
  if (c.includes('orange') || c.includes('tangier')) return 'orange';
  if (c.includes('yellow') || c.includes('accelerate')) return 'yellow';
  if (c.includes('brown') || c.includes('harvest')) return 'brown';
  return '';
};

/** Generate gradient background based on vehicle color */
const getColorGradient = (color?: string): string => {
  const gradients: Record<string, string> = {
    'black': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    'white': 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    'red': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    'blue': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    'silver': 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    'gray': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    'green': 'linear-gradient(135deg, #16a34a 0%, #166534 100%)',
    'orange': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    'yellow': 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    'brown': 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
  };
  return gradients[getColorCategory(color || '')] || 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
};

/** Build image URL candidates for fallback chain */
const getImageCandidates = (vehicle: Vehicle, exteriorColor: string, stockNumber: string): string[] => {
  const candidates: string[] = [];
  
  if (vehicle.imageUrl) candidates.push(vehicle.imageUrl);
  if (vehicle.image_url) candidates.push(vehicle.image_url);
  if (vehicle.images?.length) candidates.push(...vehicle.images);
  
  const fullModel = (vehicle.model || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const baseModel = fullModel.replace(/-ev$/, '').replace(/-hd$/, '').replace(/\d+$/, '');
  const colorCat = getColorCategory(exteriorColor);
  
  if (stockNumber) candidates.push(`/images/vehicles/${stockNumber}.jpg`);
  if (fullModel && colorCat) candidates.push(`/images/vehicles/${fullModel}-${colorCat}.jpg`);
  if (baseModel && baseModel !== fullModel && colorCat) candidates.push(`/images/vehicles/${baseModel}-${colorCat}.jpg`);
  if (fullModel) candidates.push(`/images/vehicles/${fullModel}.jpg`);
  if (baseModel && baseModel !== fullModel) candidates.push(`/images/vehicles/${baseModel}.jpg`);
  
  return candidates;
};

// ============================================================================
// DEFAULT DATA
// ============================================================================

const defaultVehicle: DetailedVehicle = {
  stockNumber: '24789', stock_number: '24789',
  year: 2025, make: 'Chevrolet', model: 'Silverado 1500',
  trim: 'LT Crew Cab 4WD', vin: '1GCUDDED5RZ123456',
  exteriorColor: 'Summit White', exterior_color: 'Summit White',
  interiorColor: 'Jet Black', interior_color: 'Jet Black',
  engine: '5.3L EcoTec3 V8', transmission: '10-Speed Automatic',
  drivetrain: '4WD', fuelEconomy: '16 city / 22 hwy',
  msrp: 52995, salePrice: 47495, sale_price: 47495, price: 47495,
  savings: 5500, monthlyLease: 398, monthlyFinance: 612,
  status: 'In Stock', mileage: 12,
  features: ['Trailering Package', 'Heated Front Seats', '13.4" Touchscreen', 'Apple CarPlay', 'Wireless Charging', 'Remote Start', 'LED Headlamps', 'Spray-On Bedliner'],
  rebates: [{ name: 'Customer Cash', amount: 2500 }, { name: 'Bonus Cash', amount: 1500 }, { name: 'Conquest Bonus', amount: 1000 }],
};

// ============================================================================
// COMPONENT
// ============================================================================

const VehicleDetail: React.FC<KioskComponentProps> = ({ navigateTo, updateCustomerData, customerData }) => {
  const [vehicleRequested, setVehicleRequested] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  
  const customerName = customerData?.customerName;
  const vehicle: DetailedVehicle = (customerData?.selectedVehicle as DetailedVehicle) || defaultVehicle;
  
  const stockNumber = vehicle.stockNumber || vehicle.stock_number || '';
  const exteriorColor = vehicle.exteriorColor || vehicle.exterior_color || '';
  const interiorColor = vehicle.interiorColor || vehicle.interior_color || '';
  const salePrice = vehicle.salePrice || vehicle.sale_price || vehicle.price || 0;
  const gradient = vehicle.gradient || getColorGradient(exteriorColor);
  
  const truckVINInfo = decodeGMTruckVIN(vehicle.vin || '', vehicle.model || '');
  const vinCabType = truckVINInfo?.cabType || '';
  const vinDriveType = truckVINInfo?.driveType || vehicle.drivetrain || '';
  
  const imageCandidates = getImageCandidates(vehicle, exteriorColor, stockNumber);

  const handleRequestVehicle = () => {
    setVehicleRequested(true);
    updateCustomerData({ vehicleRequested: { stockNumber, requestedAt: new Date().toISOString() } });
  };

  // Confirmation Screen
  if (vehicleRequested) {
    return (
      <div style={styles.container}>
        <div style={styles.confirmationOverlay}>
          <div style={styles.confirmationCard}>
            <div style={styles.confirmationIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 style={styles.confirmationTitle}>{customerName ? `Great choice, ${customerName}!` : 'Vehicle Requested!'}</h1>
            <p style={styles.confirmationSubtitle}>A team member will bring this vehicle to the showroom shortly.</p>
            <div style={styles.confirmationVehicle}>
              <div style={{ ...styles.confirmationThumb, background: gradient }}>
                <span style={styles.confirmationInitial}>{(vehicle.model || 'V').charAt(0)}</span>
              </div>
              <div style={styles.confirmationVehicleInfo}>
                <p style={styles.confirmationVehicleName}>{vehicle.year} {vehicle.model}</p>
                <p style={styles.confirmationStock}>Stock #{stockNumber}</p>
              </div>
            </div>
            <div style={styles.estimatedTime}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Estimated wait: 2-3 minutes
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigateTo('inventory')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Results
      </button>

      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          <div style={{ ...styles.mainImage, background: (!allImagesFailed && imageCandidates.length > 0) ? '#1a1a1a' : gradient }}>
            {!allImagesFailed && imageCandidates[currentImageIndex] ? (
              <img 
                src={imageCandidates[currentImageIndex]} 
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                style={styles.vehicleImage}
                onError={() => currentImageIndex < imageCandidates.length - 1 ? setCurrentImageIndex(currentImageIndex + 1) : setAllImagesFailed(true)}
              />
            ) : (
              <span style={styles.imageInitial}>{(vehicle.model || 'V').charAt(0)}</span>
            )}
            <div style={styles.statusBadge}>
              <span style={styles.statusDot} />
              {vehicle.status || 'In Stock'}
            </div>
          </div>

          <div style={styles.quickSpecs}>
            {[
              { icon: '🔧', label: 'Engine', value: vehicle.engine || 'N/A' },
              { icon: '⚙️', label: 'Transmission', value: vehicle.transmission || 'Automatic' },
              { icon: '🚗', label: 'Drivetrain', value: vehicle.drivetrain || 'N/A' },
              { icon: '⛽', label: 'Fuel Economy', value: vehicle.fuelEconomy || 'N/A' },
            ].map((spec, i) => (
              <div key={i} style={styles.specItem}>
                <span style={styles.specIcon}>{spec.icon}</span>
                <div><span style={styles.specLabel}>{spec.label}</span><span style={styles.specValue}>{spec.value}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          <div style={styles.vehicleHeader}>
            <div style={styles.titleBlock}>
              <h1 style={styles.vehicleTitle}>
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vinCabType && <span style={styles.titleSeparator}> • </span>}
                {vinCabType && <span>{vinCabType}</span>}
                {vinDriveType && <span style={styles.titleSeparator}> • </span>}
                {vinDriveType && <span>{vinDriveType}</span>}
              </h1>
              <div style={styles.subtitleRow}>
                <p style={styles.vehicleTrim}>{vehicle.trim}</p>
                <div style={styles.stockInfo}>
                  <span style={styles.stockLabel}>Stock #</span>
                  <span style={styles.stockNumber}>{stockNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.colorRow}>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: gradient }} />
              <div><span style={styles.colorLabel}>Exterior</span><span style={styles.colorValue}>{exteriorColor}</span></div>
            </div>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: '#1f2937' }} />
              <div><span style={styles.colorLabel}>Interior</span><span style={styles.colorValue}>{interiorColor}</span></div>
            </div>
          </div>

          <div style={styles.pricingCard}>
            <div style={styles.priceRow}>
              <span style={styles.msrpLabel}>MSRP</span>
              <span style={styles.msrpValue}>${(vehicle.msrp || 0).toLocaleString()}</span>
            </div>
            {vehicle.rebates?.map((r, i) => (
              <div key={i} style={styles.rebateRow}>
                <span style={styles.rebateName}>{r.name}</span>
                <span style={styles.rebateAmount}>-${r.amount.toLocaleString()}</span>
              </div>
            ))}
            <div style={styles.priceDivider} />
            <div style={styles.priceRow}>
              <span style={styles.yourPriceLabel}>Your Price</span>
              <span style={styles.yourPriceValue}>${salePrice.toLocaleString()}</span>
            </div>
            {vehicle.savings && <div style={styles.savingsBadge}>You Save ${vehicle.savings.toLocaleString()}!</div>}
            <div style={styles.paymentsGrid}>
              <div style={styles.paymentOption}>
                <span style={styles.paymentType}>Lease</span>
                <span style={styles.paymentAmount}>${vehicle.monthlyLease || 0}</span>
                <span style={styles.paymentTerm}>/mo for 39 mo</span>
              </div>
              <div style={styles.paymentOption}>
                <span style={styles.paymentType}>Finance</span>
                <span style={styles.paymentAmount}>${vehicle.monthlyFinance || 0}</span>
                <span style={styles.paymentTerm}>/mo for 72 mo</span>
              </div>
            </div>
          </div>

          {vehicle.features && vehicle.features.length > 0 && (
            <div style={styles.featuresCard}>
              <h3 style={styles.featuresTitle}>Key Features</h3>
              <div style={styles.featuresGrid}>
                {vehicle.features.slice(0, 8).map((f, i) => (
                  <div key={i} style={styles.featureItem}><span style={styles.featureCheck}>✓</span>{f}</div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.actionsColumn}>
            <button style={styles.primaryButton} onClick={handleRequestVehicle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Request This Vehicle
            </button>
            <button style={styles.secondaryButton} onClick={() => navigateTo('paymentCalculator')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
              </svg>
              Calculate Payment
            </button>
            <button style={styles.secondaryButton} onClick={() => navigateTo('tradeIn')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              Value My Trade
            </button>
            <button style={styles.secondaryButton} onClick={() => navigateTo('handoff')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Talk to a Sales Consultant
            </button>
          </div>

          <div style={styles.vinRow}>
            <span style={styles.vinLabel}>VIN:</span>
            <span style={styles.vinValue}>{vehicle.vin || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, CSSProperties> = {
  container: { flex: 1, padding: '20px 40px', overflowY: 'auto' },
  backButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer', padding: '8px 0', marginBottom: '20px' },
  content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1400px', margin: '0 auto' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  mainImage: { height: '360px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  vehicleImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' },
  imageInitial: { fontSize: '120px', fontWeight: '800', color: 'rgba(255,255,255,0.2)' },
  statusBadge: { position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0,0,0,0.7)', borderRadius: '24px', fontSize: '14px', fontWeight: '600', color: '#ffffff' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' },
  quickSpecs: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  specItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  specIcon: { fontSize: '24px' },
  specLabel: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '2px' },
  specValue: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#ffffff' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  vehicleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1 },
  vehicleTitle: { fontSize: '32px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: 1.2 },
  titleSeparator: { color: 'rgba(255,255,255,0.4)', fontWeight: '400' },
  subtitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  vehicleTrim: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: 0, textTransform: 'uppercase' },
  stockInfo: { textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' },
  stockLabel: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  stockNumber: { fontSize: '16px', fontWeight: '700', color: '#ffffff' },
  colorRow: { display: 'flex', gap: '24px' },
  colorItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  colorSwatch: { width: '40px', height: '40px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' },
  colorLabel: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  colorValue: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#ffffff' },
  pricingCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  msrpLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  msrpValue: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' },
  rebateRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' },
  rebateName: { fontSize: '13px', color: 'rgba(255,255,255,0.6)' },
  rebateAmount: { fontSize: '13px', color: '#4ade80', fontWeight: '600' },
  priceDivider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' },
  yourPriceLabel: { fontSize: '16px', color: '#ffffff', fontWeight: '600' },
  yourPriceValue: { fontSize: '32px', color: '#4ade80', fontWeight: '700' },
  savingsBadge: { background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginTop: '12px' },
  paymentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '16px' },
  paymentOption: { background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' },
  paymentType: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' },
  paymentAmount: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#ffffff' },
  paymentTerm: { display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' },
  featuresCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' },
  featuresTitle: { fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' },
  featureCheck: { color: '#4ade80', fontSize: '16px' },
  actionsColumn: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
  primaryButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px 32px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  secondaryButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  vinRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginTop: '8px' },
  vinLabel: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  vinValue: { fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' },
  confirmationOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', zIndex: 1000 },
  confirmationCard: { background: 'linear-gradient(135deg, rgba(27,115,64,0.2) 0%, rgba(13,74,40,0.2) 100%)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '500px', width: '90%' },
  confirmationIcon: { width: '80px', height: '80px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#ffffff' },
  confirmationTitle: { fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' },
  confirmationSubtitle: { fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.5 },
  confirmationVehicle: { display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px' },
  confirmationThumb: { width: '80px', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  confirmationInitial: { fontSize: '24px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  confirmationVehicleInfo: { textAlign: 'left' },
  confirmationVehicleName: { fontSize: '16px', fontWeight: '600', color: '#ffffff' },
  confirmationStock: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  estimatedTime: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' },
};

export default VehicleDetail;
