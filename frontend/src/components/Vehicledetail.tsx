import React, { useState } from 'react';
import type { Vehicle, KioskComponentProps } from '../types';
import { vehicleDetailStyles as styles } from '../styles/VehicleDetailStyles';
import { 
  decodeGMTruckVIN, 
  getVehicleImageCandidates, 
  getColorGradient 
} from '../utils/vehicleHelpers';

// Extended vehicle with additional detail fields
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

// Default vehicle for demo/fallback
const defaultVehicle: DetailedVehicle = {
  stockNumber: '24789',
  stock_number: '24789',
  year: 2025,
  make: 'Chevrolet',
  model: 'Silverado 1500',
  trim: 'LT Crew Cab 4WD',
  vin: '1GCUDDED5RZ123456',
  exteriorColor: 'Summit White',
  exterior_color: 'Summit White',
  interiorColor: 'Jet Black',
  interior_color: 'Jet Black',
  engine: '5.3L EcoTec3 V8',
  transmission: '10-Speed Automatic',
  drivetrain: '4WD',
  fuelEconomy: '16 city / 22 hwy',
  msrp: 52995,
  salePrice: 47495,
  sale_price: 47495,
  price: 47495,
  savings: 5500,
  monthlyLease: 398,
  monthlyFinance: 612,
  status: 'In Stock',
  mileage: 12,
  gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  features: [
    'Trailering Package',
    'Heated Front Seats',
    '13.4" Diagonal Touchscreen',
    'Apple CarPlay & Android Auto',
    'Wireless Charging',
    'Remote Start',
    'LED Headlamps',
    'Spray-On Bedliner',
  ],
  rebates: [
    { name: 'Customer Cash', amount: 2500 },
    { name: 'Bonus Cash', amount: 1500 },
    { name: 'Conquest Bonus', amount: 1000 },
  ],
};

const VehicleDetail: React.FC<KioskComponentProps> = ({ navigateTo, updateCustomerData, customerData }) => {
  const [vehicleRequested, setVehicleRequested] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [allImagesFailed, setAllImagesFailed] = useState<boolean>(false);
  
  const customerName = customerData?.customerName;
  const vehicle: DetailedVehicle = (customerData?.selectedVehicle as DetailedVehicle) || defaultVehicle;
  
  // Normalize vehicle properties
  const stockNumber = vehicle.stockNumber || vehicle.stock_number || '';
  const exteriorColor = vehicle.exteriorColor || vehicle.exterior_color || '';
  const interiorColor = vehicle.interiorColor || vehicle.interior_color || '';
  const salePrice = vehicle.salePrice || vehicle.sale_price || vehicle.price || 0;
  const gradient = vehicle.gradient || getColorGradient(exteriorColor);
  
  // Decode VIN for Silverado trucks
  const truckVINInfo = decodeGMTruckVIN(vehicle.vin || '', vehicle.model || '');
  const vinCabType = truckVINInfo?.cabType || '';
  const vinDriveType = truckVINInfo?.driveType || vehicle.drivetrain || '';
  
  // Get image candidates for fallback chain
  const imageCandidates = getVehicleImageCandidates(vehicle, exteriorColor);

  const handleRequestVehicle = (): void => {
    setVehicleRequested(true);
    updateCustomerData({
      vehicleRequested: {
        stockNumber: stockNumber,
        requestedAt: new Date().toISOString(),
      },
    });
  };

  const handleCalculatePayment = (): void => navigateTo('paymentCalculator');
  const handleTradeIn = (): void => navigateTo('tradeIn');
  const handleTalkToSales = (): void => navigateTo('handoff');

  // Vehicle Requested Confirmation
  if (vehicleRequested) {
    return (
      <div style={styles.container}>
        <div style={styles.confirmationOverlay}>
          <div style={styles.confirmationCard}>
            <div style={styles.confirmationIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            
            <h1 style={styles.confirmationTitle}>
              {customerName ? `Great choice, ${customerName}!` : 'Vehicle Requested!'}
            </h1>
            <p style={styles.confirmationSubtitle}>
              A team member will bring this vehicle to the front of the showroom shortly.
            </p>

            <div style={styles.confirmationVehicle}>
              <div style={{ ...styles.confirmationThumb, background: gradient }}>
                <span style={styles.confirmationInitial}>{(vehicle.model || 'V').charAt(0)}</span>
              </div>
              <div style={styles.confirmationVehicleInfo}>
                <p style={styles.confirmationVehicleName}>
                  {vehicle.year} {vehicle.model}
                </p>
                <p style={styles.confirmationStock}>Stock #{stockNumber}</p>
              </div>
            </div>

            <div style={styles.estimatedTime}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
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
    <div style={styles.container}>
      {/* Back Button */}
      <button style={styles.backButton} onClick={() => navigateTo('inventory')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Results
      </button>

      <div style={styles.content}>
        {/* Left Column - Vehicle Image */}
        <div style={styles.leftColumn}>
          <div style={{ 
            ...styles.mainImage, 
            background: (!allImagesFailed && imageCandidates.length > 0) ? '#1a1a1a' : gradient 
          }}>
            {!allImagesFailed && imageCandidates.length > 0 && imageCandidates[currentImageIndex] ? (
              <img 
                src={imageCandidates[currentImageIndex]} 
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                style={styles.vehicleImage}
                onError={() => {
                  if (currentImageIndex < imageCandidates.length - 1) {
                    setCurrentImageIndex(currentImageIndex + 1);
                  } else {
                    setAllImagesFailed(true);
                  }
                }}
              />
            ) : (
              <span style={styles.imageInitial}>{(vehicle.model || 'V').charAt(0)}</span>
            )}
            <div style={styles.statusBadge}>
              <span style={styles.statusDot} />
              {vehicle.status || 'In Stock'}
            </div>
          </div>

          {/* Quick Specs */}
          <div style={styles.quickSpecs}>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>🔧</span>
              <div>
                <span style={styles.specLabel}>Engine</span>
                <span style={styles.specValue}>{vehicle.engine || 'N/A'}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>⚙️</span>
              <div>
                <span style={styles.specLabel}>Transmission</span>
                <span style={styles.specValue}>{vehicle.transmission || 'Automatic'}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>🚗</span>
              <div>
                <span style={styles.specLabel}>Drivetrain</span>
                <span style={styles.specValue}>{vehicle.drivetrain || 'N/A'}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>⛽</span>
              <div>
                <span style={styles.specLabel}>Fuel Economy</span>
                <span style={styles.specValue}>{vehicle.fuelEconomy || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div style={styles.rightColumn}>
          {/* Header with VIN-decoded cab/drive info */}
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

          {/* Colors */}
          <div style={styles.colorRow}>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: gradient }} />
              <div>
                <span style={styles.colorLabel}>Exterior</span>
                <span style={styles.colorValue}>{exteriorColor}</span>
              </div>
            </div>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: '#1f2937' }} />
              <div>
                <span style={styles.colorLabel}>Interior</span>
                <span style={styles.colorValue}>{interiorColor}</span>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div style={styles.pricingCard}>
            <div style={styles.priceRow}>
              <span style={styles.msrpLabel}>MSRP</span>
              <span style={styles.msrpValue}>${(vehicle.msrp || 0).toLocaleString()}</span>
            </div>
            
            {vehicle.rebates?.map((rebate, idx) => (
              <div key={idx} style={styles.rebateRow}>
                <span style={styles.rebateName}>{rebate.name}</span>
                <span style={styles.rebateAmount}>-${rebate.amount.toLocaleString()}</span>
              </div>
            ))}
            
            <div style={styles.priceDivider} />
            
            <div style={styles.priceRow}>
              <span style={styles.yourPriceLabel}>Your Price</span>
              <span style={styles.yourPriceValue}>${salePrice.toLocaleString()}</span>
            </div>
            
            {vehicle.savings && (
              <div style={styles.savingsBadge}>You Save ${vehicle.savings.toLocaleString()}!</div>
            )}

            {/* Payments */}
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

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div style={styles.featuresCard}>
              <h3 style={styles.featuresTitle}>Key Features</h3>
              <div style={styles.featuresGrid}>
                {vehicle.features.slice(0, 8).map((feature, idx) => (
                  <div key={idx} style={styles.featureItem}>
                    <span style={styles.featureCheck}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionsColumn}>
            <button style={styles.primaryButton} onClick={handleRequestVehicle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Request This Vehicle
            </button>
            <button style={styles.secondaryButton} onClick={handleCalculatePayment}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="12" y2="14"/>
              </svg>
              Calculate Payment
            </button>
            <button style={styles.secondaryButton} onClick={handleTradeIn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              Value My Trade
            </button>
            <button style={styles.secondaryButton} onClick={handleTalkToSales}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Talk to a Sales Consultant
            </button>
          </div>

          {/* VIN */}
          <div style={styles.vinRow}>
            <span style={styles.vinLabel}>VIN:</span>
            <span style={styles.vinValue}>{vehicle.vin || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
