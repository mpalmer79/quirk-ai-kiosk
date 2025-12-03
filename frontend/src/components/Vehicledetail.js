import React, { useState } from 'react';

const VehicleDetail = ({ navigateTo, updateCustomerData, customerData }) => {
  const [vehicleRequested, setVehicleRequested] = useState(false);
  
  // Get customer name for personalization
  const customerName = customerData?.customerName;
  
  const vehicle = customerData.selectedVehicle || {
    stockNumber: '24789',
    year: 2025,
    make: 'Chevrolet',
    model: 'Silverado 1500',
    trim: 'LT Crew Cab 4WD',
    vin: '1GCUDDED5RZ123456',
    exteriorColor: 'Summit White',
    interiorColor: 'Jet Black',
    engine: '5.3L EcoTec3 V8',
    transmission: '10-Speed Automatic',
    drivetrain: '4WD',
    fuelEconomy: '16 city / 22 hwy',
    msrp: 52995,
    salePrice: 47495,
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
      '20" Painted Aluminum Wheels',
      'Rear Vision Camera',
    ],
    rebates: [
      { name: 'Customer Cash', amount: 2500 },
      { name: 'Bonus Cash', amount: 1500 },
      { name: 'Conquest Bonus', amount: 1000 },
    ],
  };

  const handleRequestVehicle = () => {
    setVehicleRequested(true);
    
    // Update customer data with request info
    updateCustomerData({
      vehicleRequested: {
        stockNumber: vehicle.stockNumber,
        requestedAt: new Date().toISOString(),
      },
    });
    
    // TODO: Future - send notification to lot attendant/sales team
    // api.requestVehicle(vehicle.stockNumber);
  };

  const handleCalculatePayment = () => {
    navigateTo('paymentCalculator');
  };

  const handleTradeIn = () => {
    navigateTo('tradeIn');
  };

  const handleTalkToSales = () => {
    navigateTo('handoff');
  };

  // Vehicle Requested Confirmation State
  if (vehicleRequested) {
    return (
      <div style={styles.container}>
        <div style={styles.confirmationOverlay}>
          <div style={styles.confirmationCard}>
            {/* Success Icon */}
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

            {/* Vehicle Summary */}
            <div style={styles.confirmationVehicle}>
              <div style={{ ...styles.confirmationThumb, background: vehicle.gradient }}>
                <span style={styles.confirmationInitial}>{vehicle.model.charAt(0)}</span>
              </div>
              <div style={styles.confirmationVehicleInfo}>
                <span style={styles.confirmationVehicleName}>
                  {vehicle.year} {vehicle.model}
                </span>
                <span style={styles.confirmationVehicleTrim}>{vehicle.trim}</span>
                <span style={styles.confirmationStock}>Stock #{vehicle.stockNumber}</span>
              </div>
            </div>

            {/* What to Expect */}
            <div style={styles.expectSection}>
              <h4 style={styles.expectTitle}>What to Expect</h4>
              <div style={styles.expectSteps}>
                <div style={styles.expectStep}>
                  <span style={styles.stepNumber}>1</span>
                  <span style={styles.stepText}>Vehicle will be brought up front</span>
                </div>
                <div style={styles.expectStep}>
                  <span style={styles.stepNumber}>2</span>
                  <span style={styles.stepText}>A team member will meet you</span>
                </div>
                <div style={styles.expectStep}>
                  <span style={styles.stepNumber}>3</span>
                  <span style={styles.stepText}>Take it for a test drive!</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.confirmationActions}>
              <button 
                style={styles.primaryButton}
                onClick={handleTalkToSales}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Connect with Sales Consultant
              </button>
              
              <button 
                style={styles.secondaryButton}
                onClick={() => setVehicleRequested(false)}
              >
                Back to Vehicle Details
              </button>
              
              <button 
                style={styles.tertiaryButton}
                onClick={() => navigateTo('inventory')}
              >
                Continue Browsing
              </button>
            </div>

            {/* Estimated Time */}
            <div style={styles.estimatedTime}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Estimated wait: 2-3 minutes
            </div>
          </div>
        </div>

        <style>{`
          @keyframes checkmark {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
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
        {/* Left Column - Vehicle Image & Gallery */}
        <div style={styles.leftColumn}>
          <div style={{ ...styles.mainImage, background: vehicle.gradient }}>
            <span style={styles.imageInitial}>{vehicle.model.charAt(0)}</span>
            <div style={styles.statusBadge}>
              <span style={styles.statusDot} />
              {vehicle.status}
            </div>
          </div>

          {/* Quick Specs */}
          <div style={styles.quickSpecs}>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>🔧</span>
              <div>
                <span style={styles.specLabel}>Engine</span>
                <span style={styles.specValue}>{vehicle.engine}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>⚙️</span>
              <div>
                <span style={styles.specLabel}>Transmission</span>
                <span style={styles.specValue}>{vehicle.transmission}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>🚗</span>
              <div>
                <span style={styles.specLabel}>Drivetrain</span>
                <span style={styles.specValue}>{vehicle.drivetrain}</span>
              </div>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specIcon}>⛽</span>
              <div>
                <span style={styles.specLabel}>Fuel Economy</span>
                <span style={styles.specValue}>{vehicle.fuelEconomy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div style={styles.rightColumn}>
          {/* Header */}
          <div style={styles.vehicleHeader}>
            <div>
              <h1 style={styles.vehicleTitle}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p style={styles.vehicleTrim}>{vehicle.trim}</p>
            </div>
            <div style={styles.stockInfo}>
              <span style={styles.stockLabel}>Stock #</span>
              <span style={styles.stockNumber}>{vehicle.stockNumber}</span>
            </div>
          </div>

          {/* Colors */}
          <div style={styles.colorRow}>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: vehicle.gradient }} />
              <div>
                <span style={styles.colorLabel}>Exterior</span>
                <span style={styles.colorValue}>{vehicle.exteriorColor}</span>
              </div>
            </div>
            <div style={styles.colorItem}>
              <div style={{ ...styles.colorSwatch, background: '#1f2937' }} />
              <div>
                <span style={styles.colorLabel}>Interior</span>
                <span style={styles.colorValue}>{vehicle.interiorColor}</span>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div style={styles.pricingCard}>
            <div style={styles.priceRow}>
              <span style={styles.msrpLabel}>MSRP</span>
              <span style={styles.msrpValue}>${vehicle.msrp.toLocaleString()}</span>
            </div>
            
            {/* Rebates */}
            {vehicle.rebates && vehicle.rebates.map((rebate, idx) => (
              <div key={idx} style={styles.rebateRow}>
                <span style={styles.rebateName}>{rebate.name}</span>
                <span style={styles.rebateAmount}>-${rebate.amount.toLocaleString()}</span>
              </div>
            ))}
            
            <div style={styles.priceDivider} />
            
            <div style={styles.priceRow}>
              <span style={styles.yourPriceLabel}>Your Price</span>
              <span style={styles.yourPriceValue}>${vehicle.salePrice.toLocaleString()}</span>
            </div>
            
            <div style={styles.savingsBadge}>
              You Save ${vehicle.savings.toLocaleString()}!
            </div>

            {/* Estimated Payments */}
            <div style={styles.paymentsGrid}>
              <div style={styles.paymentOption}>
                <span style={styles.paymentType}>Lease</span>
                <span style={styles.paymentAmount}>${vehicle.monthlyLease}</span>
                <span style={styles.paymentTerm}>/mo for 39 mo</span>
              </div>
              <div style={styles.paymentOption}>
                <span style={styles.paymentType}>Finance</span>
                <span style={styles.paymentAmount}>${vehicle.monthlyFinance}</span>
                <span style={styles.paymentTerm}>/mo for 72 mo</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div style={styles.featuresSection}>
            <h3 style={styles.sectionTitle}>Key Features</h3>
            <div style={styles.featuresList}>
              {vehicle.features.map((feature, idx) => (
                <div key={idx} style={styles.featureItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            {/* Primary CTA - Request Vehicle */}
            <button style={styles.requestButton} onClick={handleRequestVehicle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
              Request This Vehicle
            </button>
            
            <button style={styles.secondaryButton} onClick={handleCalculatePayment}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <path d="M8 6h8M8 10h8M8 14h4"/>
              </svg>
              Calculate Payment
            </button>
            
            <button style={styles.secondaryButton} onClick={handleTradeIn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
              Value My Trade
            </button>

            <button style={styles.tertiaryButton} onClick={handleTalkToSales}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Talk to a Sales Consultant
            </button>
          </div>

          {/* VIN */}
          <div style={styles.vinSection}>
            <span style={styles.vinLabel}>VIN:</span>
            <span style={styles.vinValue}>{vehicle.vin}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: '24px 40px',
    overflow: 'auto',
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
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mainImage: {
    height: '360px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageInitial: {
    fontSize: '120px',
    fontWeight: '800',
    color: 'rgba(255,255,255,0.2)',
  },
  statusBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#4ade80',
  },
  quickSpecs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  specItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
  },
  specIcon: {
    fontSize: '24px',
  },
  specLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  specValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  vehicleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  vehicleTrim: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '4px 0 0 0',
  },
  stockInfo: {
    textAlign: 'right',
  },
  stockLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  stockNumber: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  },
  colorRow: {
    display: 'flex',
    gap: '24px',
  },
  colorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorSwatch: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  colorLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  colorValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  pricingCard: {
    padding: '24px',
    background: 'rgba(27, 115, 64, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(27, 115, 64, 0.3)',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  msrpLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  msrpValue: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'line-through',
  },
  rebateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  rebateName: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },
  rebateAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4ade80',
  },
  priceDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '12px 0',
  },
  yourPriceLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  yourPriceValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#4ade80',
  },
  savingsBadge: {
    textAlign: 'center',
    padding: '10px',
    background: 'rgba(74, 222, 128, 0.2)',
    borderRadius: '8px',
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '12px',
  },
  paymentsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px',
  },
  paymentOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
  },
  paymentType: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  paymentAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
  },
  paymentTerm: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  featuresSection: {
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 16px 0',
  },
  featuresList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  requestButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(27, 115, 64, 0.4)',
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '18px 24px',
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
  tertiaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 24px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  vinSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
  },
  vinLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  vinValue: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.6)',
  },
  // Confirmation State Styles
  confirmationOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 200px)',
  },
  confirmationCard: {
    maxWidth: '500px',
    width: '100%',
    padding: '40px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  confirmationIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(74, 222, 128, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4ade80',
    margin: '0 auto 24px',
    animation: 'checkmark 0.5s ease',
  },
  confirmationTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  confirmationSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  confirmationVehicle: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  confirmationThumb: {
    width: '60px',
    height: '60px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  confirmationInitial: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
  },
  confirmationVehicleInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  confirmationVehicleName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmationVehicleTrim: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  },
  confirmationStock: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '4px',
  },
  expectSection: {
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  expectTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    margin: '0 0 16px 0',
  },
  expectSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  expectStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(27, 115, 64, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#4ade80',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  },
  confirmationActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  estimatedTime: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
};

export default VehicleDetail;
