import React from 'react';

const VehicleDetail = ({ navigateTo, updateCustomerData, customerData }) => {
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

  const handleScheduleTestDrive = () => {
    navigateTo('handoff');
  };

  const handleCalculatePayment = () => {
    navigateTo('paymentCalculator');
  };

  const handleTradeIn = () => {
    navigateTo('tradeIn');
  };

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
            <button style={styles.primaryButton} onClick={handleScheduleTestDrive}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Schedule Test Drive
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
};

export default VehicleDetail;
