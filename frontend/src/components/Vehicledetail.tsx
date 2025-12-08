import React, { useState, CSSProperties } from 'react';
import type { Vehicle, KioskComponentProps } from '../types';

interface DetailedVehicle extends Vehicle {
  transmission?: string; fuelEconomy?: string; savings?: number;
  monthlyLease?: number; monthlyFinance?: number; mileage?: number;
  gradient?: string; rebates?: Array<{ name: string; amount: number }>;
}

interface TruckVINInfo { cabType: string; driveType: string; }

const decodeGMTruckVIN = (vin: string, model: string): TruckVINInfo | null => {
  if (!vin || vin.length !== 17) return null;
  if (!(model || '').toLowerCase().includes('silverado')) return null;
  const v = vin.toUpperCase();
  let cabType = '', driveType = '';
  switch (v[5]) {
    case 'A': case 'B': cabType = 'Regular Cab'; break;
    case 'C': case 'D': cabType = 'Double Cab'; break;
    case 'K': case 'U': case 'G': cabType = 'Crew Cab'; break;
  }
  switch (v[6]) {
    case 'E': case 'K': case 'G': case 'J': driveType = '4WD'; break;
    case 'A': case 'D': case 'C': case 'B': driveType = '2WD'; break;
  }
  return (cabType || driveType) ? { cabType, driveType } : null;
};

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

const defaultVehicle: DetailedVehicle = {
  stockNumber: '24789', stock_number: '24789', year: 2025, make: 'Chevrolet', model: 'Silverado 1500',
  trim: 'LT Crew Cab 4WD', vin: '1GCUDDED5RZ123456', exteriorColor: 'Summit White', exterior_color: 'Summit White',
  interiorColor: 'Jet Black', interior_color: 'Jet Black', engine: '5.3L EcoTec3 V8', transmission: '10-Speed Automatic',
  drivetrain: '4WD', fuelEconomy: '16 city / 22 hwy', msrp: 52995, salePrice: 47495, sale_price: 47495, price: 47495,
  savings: 5500, monthlyLease: 398, monthlyFinance: 612, status: 'In Stock', mileage: 12,
  gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  features: ['Trailering Package', 'Heated Front Seats', '13.4" Diagonal Touchscreen', 'Apple CarPlay & Android Auto',
    'Wireless Charging', 'Remote Start', 'LED Headlamps', 'Spray-On Bedliner', '20" Painted Aluminum Wheels', 'Rear Vision Camera'],
  rebates: [{ name: 'Customer Cash', amount: 2500 }, { name: 'Bonus Cash', amount: 1500 }, { name: 'Conquest Bonus', amount: 1000 }],
};

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
  const gradient = vehicle.gradient || 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)';

  const truckVINInfo = decodeGMTruckVIN(vehicle.vin || '', vehicle.model || '');
  const vinCabType = truckVINInfo?.cabType || '';
  const vinDriveType = truckVINInfo?.driveType || '';
  const imageCandidates = getImageCandidates(vehicle, exteriorColor, stockNumber);

  const handleRequestVehicle = () => {
    setVehicleRequested(true);
    updateCustomerData({ vehicleRequested: { stockNumber, requestedAt: new Date().toISOString() } });
  };

  // Confirmation State
  if (vehicleRequested) {
    return (
      <div style={s.container}>
        <div style={s.confirmOverlay}>
          <div style={s.confirmCard}>
            <div style={s.confirmIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 style={s.confirmTitle}>{customerName ? `Great choice, ${customerName}!` : 'Vehicle Requested!'}</h1>
            <p style={s.confirmSubtitle}>A team member will bring this vehicle to the front of the showroom shortly.</p>
            <div style={s.confirmVehicle}>
              <div style={{ ...s.confirmThumb, background: gradient }}>
                <span style={s.confirmInitial}>{(vehicle.model || 'V').charAt(0)}</span>
              </div>
              <div style={s.confirmVehicleInfo}>
                <span style={s.confirmVehicleName}>{vehicle.year} {vehicle.model}</span>
                <span style={s.confirmVehicleTrim}>{vehicle.trim}</span>
                <span style={s.confirmStock}>Stock #{stockNumber}</span>
              </div>
            </div>
            <div style={s.expectSection}>
              <h4 style={s.expectTitle}>What to Expect</h4>
              <div style={s.expectSteps}>
                {['Vehicle will be brought up front', 'A team member will meet you', 'Take it for a test drive!'].map((text, i) => (
                  <div key={i} style={s.expectStep}>
                    <span style={s.stepNumber}>{i + 1}</span>
                    <span style={s.stepText}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={s.confirmActions}>
              <button style={s.primaryBtn} onClick={() => navigateTo('handoff')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Connect with Sales Consultant
              </button>
              <button style={s.secondaryBtn} onClick={() => setVehicleRequested(false)}>Back to Vehicle Details</button>
              <button style={s.tertiaryBtn} onClick={() => navigateTo('inventory')}>Continue Browsing</button>
            </div>
            <div style={s.estimatedTime}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Estimated wait: 2-3 minutes
            </div>
          </div>
        </div>
        <style>{`@keyframes checkmark { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <button style={s.backBtn} onClick={() => navigateTo('inventory')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Results
      </button>
      <div style={s.content}>
        {/* Left Column */}
        <div style={s.leftCol}>
          <div style={{ ...s.mainImage, background: (!allImagesFailed && imageCandidates.length > 0) ? '#1a1a1a' : gradient }}>
            {!allImagesFailed && imageCandidates.length > 0 && imageCandidates[currentImageIndex] ? (
              <img src={imageCandidates[currentImageIndex]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} style={s.vehicleImg}
                onError={() => currentImageIndex < imageCandidates.length - 1 ? setCurrentImageIndex(currentImageIndex + 1) : setAllImagesFailed(true)} />
            ) : (
              <span style={s.imageInitial}>{(vehicle.model || 'V').charAt(0)}</span>
            )}
            <div style={s.statusBadge}><span style={s.statusDot} />{vehicle.status || 'In Stock'}</div>
          </div>
          <div style={s.quickSpecs}>
            {[{ icon: '🔧', label: 'Engine', value: vehicle.engine || 'N/A' },
              { icon: '⚙️', label: 'Transmission', value: vehicle.transmission || 'Automatic' },
              { icon: '🚗', label: 'Drivetrain', value: vehicle.drivetrain || 'N/A' },
              { icon: '⛽', label: 'Fuel Economy', value: vehicle.fuelEconomy || 'N/A' }].map((spec, i) => (
              <div key={i} style={s.specItem}>
                <span style={s.specIcon}>{spec.icon}</span>
                <div><span style={s.specLabel}>{spec.label}</span><span style={s.specValue}>{spec.value}</span></div>
              </div>
            ))}
          </div>
        </div>
        {/* Right Column */}
        <div style={s.rightCol}>
          <div style={s.vehicleHeader}>
            <div>
              <h1 style={s.vehicleTitle}>{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              {(vinCabType || vinDriveType) && <p style={s.vinDecodedInfo}>{vinCabType}{vinCabType && vinDriveType && ' • '}{vinDriveType}</p>}
              <p style={s.vehicleTrim}>{vehicle.trim}</p>
            </div>
            <div style={s.stockInfo}><span style={s.stockLabel}>Stock #</span><span style={s.stockNum}>{stockNumber}</span></div>
          </div>
          <div style={s.colorRow}>
            <div style={s.colorItem}><div style={{ ...s.colorSwatch, background: gradient }} /><div><span style={s.colorLabel}>Exterior</span><span style={s.colorValue}>{exteriorColor}</span></div></div>
            <div style={s.colorItem}><div style={{ ...s.colorSwatch, background: '#1f2937' }} /><div><span style={s.colorLabel}>Interior</span><span style={s.colorValue}>{interiorColor}</span></div></div>
          </div>
          <div style={s.pricingCard}>
            <div style={s.priceRow}><span style={s.msrpLabel}>MSRP</span><span style={s.msrpValue}>${(vehicle.msrp || 0).toLocaleString()}</span></div>
            {vehicle.rebates?.map((rebate, i) => (
              <div key={i} style={s.rebateRow}><span style={s.rebateName}>{rebate.name}</span><span style={s.rebateAmt}>-${rebate.amount.toLocaleString()}</span></div>
            ))}
            <div style={s.priceDivider} />
            <div style={s.priceRow}><span style={s.yourPriceLabel}>Your Price</span><span style={s.yourPriceValue}>${salePrice.toLocaleString()}</span></div>
            {vehicle.savings && <div style={s.savingsBadge}>You Save ${vehicle.savings.toLocaleString()}!</div>}
            <div style={s.paymentsGrid}>
              <div style={s.paymentOpt}><span style={s.paymentType}>Lease</span><span style={s.paymentAmt}>${vehicle.monthlyLease || 0}</span><span style={s.paymentTerm}>/mo for 39 mo</span></div>
              <div style={s.paymentOpt}><span style={s.paymentType}>Finance</span><span style={s.paymentAmt}>${vehicle.monthlyFinance || 0}</span><span style={s.paymentTerm}>/mo for 72 mo</span></div>
            </div>
          </div>
          <div style={s.featuresSection}>
            <h3 style={s.sectionTitle}>Key Features</h3>
            <div style={s.featuresList}>
              {(vehicle.features || []).map((feature, i) => (
                <div key={i} style={s.featureItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div style={s.actionBtns}>
            <button style={s.requestBtn} onClick={handleRequestVehicle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
              </svg>
              Request This Vehicle
            </button>
            <button style={s.secondaryBtn} onClick={() => navigateTo('paymentCalculator')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>
              Calculate Payment
            </button>
            <button style={s.secondaryBtn} onClick={() => navigateTo('tradeIn')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
              Value My Trade
            </button>
            <button style={s.tertiaryBtn} onClick={() => navigateTo('handoff')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Talk to a Sales Consultant
            </button>
          </div>
          <div style={s.vinSection}><span style={s.vinLabel}>VIN:</span><span style={s.vinValue}>{vehicle.vin || 'N/A'}</span></div>
        </div>
      </div>
    </div>
  );
};

// Styles
const s: Record<string, CSSProperties> = {
  container: { flex: 1, padding: '24px 40px', overflow: 'auto' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '24px' },
  content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1400px', margin: '0 auto' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  mainImage: { aspectRatio: '16/10', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  vehicleImg: { width: '100%', height: '100%', objectFit: 'cover' },
  imageInitial: { fontSize: '120px', fontWeight: 800, color: 'rgba(255,255,255,0.2)' },
  statusBadge: { position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#fff' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' },
  quickSpecs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  specItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  specIcon: { fontSize: '24px' },
  specLabel: { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' },
  specValue: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#fff' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  vehicleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' },
  vehicleTitle: { fontSize: '32px', fontWeight: 700, color: '#fff', margin: 0 },
  vinDecodedInfo: { fontSize: '14px', color: '#4ade80', margin: '4px 0 0 0', fontWeight: 600 },
  vehicleTrim: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0' },
  stockInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  stockLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
  stockNum: { fontSize: '18px', fontWeight: 700, color: '#fff' },
  colorRow: { display: 'flex', gap: '16px' },
  colorItem: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  colorSwatch: { width: '40px', height: '40px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' },
  colorLabel: { display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
  colorValue: { display: 'block', fontSize: '14px', color: '#fff', fontWeight: 600 },
  pricingCard: { padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  msrpLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' },
  msrpValue: { fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' },
  rebateRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  rebateName: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  rebateAmt: { fontSize: '14px', fontWeight: 600, color: '#4ade80' },
  priceDivider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' },
  yourPriceLabel: { fontSize: '16px', fontWeight: 700, color: '#fff' },
  yourPriceValue: { fontSize: '36px', fontWeight: 800, color: '#4ade80' },
  savingsBadge: { display: 'inline-block', padding: '8px 16px', background: 'rgba(74,222,128,0.15)', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: '#4ade80', marginTop: '12px' },
  paymentsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' },
  paymentOpt: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' },
  paymentType: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' },
  paymentAmt: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  paymentTerm: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
  featuresSection: { padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 16px 0' },
  featuresList: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' },
  actionBtns: { display: 'flex', flexDirection: 'column', gap: '12px' },
  requestBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px 24px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(27,115,64,0.4)' },
  primaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '18px 24px', background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  tertiaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 24px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  vinSection: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' },
  vinLabel: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' },
  vinValue: { fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' },
  // Confirmation styles
  confirmOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' },
  confirmCard: { maxWidth: '500px', width: '100%', padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  confirmIcon: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', margin: '0 auto 24px', animation: 'checkmark 0.5s ease' },
  confirmTitle: { fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' },
  confirmSubtitle: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0', lineHeight: 1.5 },
  confirmVehicle: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '24px', textAlign: 'left' },
  confirmThumb: { width: '60px', height: '60px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  confirmInitial: { fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.3)' },
  confirmVehicleInfo: { display: 'flex', flexDirection: 'column' },
  confirmVehicleName: { fontSize: '18px', fontWeight: 700, color: '#fff' },
  confirmVehicleTrim: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' },
  confirmStock: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' },
  expectSection: { padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '24px', textAlign: 'left' },
  expectTitle: { fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px 0' },
  expectSteps: { display: 'flex', flexDirection: 'column', gap: '12px' },
  expectStep: { display: 'flex', alignItems: 'center', gap: '12px' },
  stepNumber: { width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(27,115,64,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#4ade80', flexShrink: 0 },
  stepText: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' },
  confirmActions: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  estimatedTime: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
};

export default VehicleDetail;
