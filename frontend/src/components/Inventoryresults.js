import React, { useState, useEffect } from 'react';

const InventoryResults = ({ navigateTo, updateCustomerData, customerData }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock inventory - replace with actual API call
      const mockVehicles = [
        {
          id: 1,
          stockNumber: '24789',
          year: 2025,
          make: 'Chevrolet',
          model: 'Silverado 1500',
          trim: 'LT Crew Cab 4WD',
          exteriorColor: 'Summit White',
          msrp: 52995,
          salePrice: 47495,
          monthlyLease: 398,
          monthlyFinance: 612,
          status: 'In Stock',
          matchScore: 98,
          features: ['Trailering Pkg', 'Heated Seats', '13.4" Screen'],
          gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
        },
        {
          id: 2,
          stockNumber: '24801',
          year: 2025,
          make: 'Chevrolet',
          model: 'Silverado 1500',
          trim: 'RST Crew Cab 4WD',
          exteriorColor: 'Black',
          msrp: 58495,
          salePrice: 53995,
          monthlyLease: 449,
          monthlyFinance: 698,
          status: 'In Stock',
          matchScore: 95,
          features: ['Z71 Off-Road', 'Bose Audio', 'Sunroof'],
          gradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        },
        {
          id: 3,
          stockNumber: '24756',
          year: 2025,
          make: 'Chevrolet',
          model: 'Tahoe',
          trim: 'LT 4WD',
          exteriorColor: 'Empire Beige',
          msrp: 63995,
          salePrice: 59995,
          monthlyLease: 549,
          monthlyFinance: 798,
          status: 'In Stock',
          matchScore: 92,
          features: ['3rd Row', 'Max Trailering', 'Leather'],
          gradient: 'linear-gradient(135deg, #d4b896 0%, #a78b6c 100%)',
        },
        {
          id: 4,
          stockNumber: '24812',
          year: 2025,
          make: 'Chevrolet',
          model: 'Equinox',
          trim: 'RS AWD',
          exteriorColor: 'Radiant Red',
          msrp: 36495,
          salePrice: 33995,
          monthlyLease: 299,
          monthlyFinance: 448,
          status: 'In Stock',
          matchScore: 88,
          features: ['Sport Appearance', 'Panoramic Roof', 'Safety Pkg'],
          gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        },
        {
          id: 5,
          stockNumber: '24834',
          year: 2025,
          make: 'Chevrolet',
          model: 'Corvette',
          trim: 'Stingray 3LT',
          exteriorColor: 'Torch Red',
          msrp: 79995,
          salePrice: 79995,
          monthlyLease: 899,
          monthlyFinance: 1198,
          status: 'In Stock',
          matchScore: 85,
          features: ['Z51 Performance', 'Magnetic Ride', 'Carbon Fiber'],
          gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
        },
        {
          id: 6,
          stockNumber: '24867',
          year: 2025,
          make: 'Chevrolet',
          model: 'Trailblazer',
          trim: 'ACTIV AWD',
          exteriorColor: 'Sterling Gray',
          msrp: 29495,
          salePrice: 27495,
          monthlyLease: 259,
          monthlyFinance: 398,
          status: 'In Transit',
          matchScore: 82,
          features: ['AWD', 'Roof Rails', 'Sport Interior'],
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        },
      ];
      
      setVehicles(mockVehicles);
      setLoading(false);
    };

    fetchVehicles();
  }, [customerData]);

  const handleVehicleSelect = (vehicle) => {
    updateCustomerData({ selectedVehicle: vehicle });
    navigateTo('vehicleDetail');
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'priceLow': return a.salePrice - b.salePrice;
      case 'priceHigh': return b.salePrice - a.salePrice;
      case 'newest': return b.year - a.year;
      default: return b.matchScore - a.matchScore;
    }
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Finding your perfect matches...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span style={styles.matchCount}>{vehicles.length}</span> Vehicles Match
          </h1>
          <p style={styles.subtitle}>Sorted by best match based on your preferences</p>
        </div>

        <div style={styles.headerRight}>
          <select 
            style={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recommended">Best Match</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div style={styles.vehicleGrid}>
        {sortedVehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            style={styles.vehicleCard}
            onClick={() => handleVehicleSelect(vehicle)}
          >
            {/* Match Score */}
            <div style={styles.matchBadge}>
              <span style={styles.matchScore}>{vehicle.matchScore}%</span>
              <span style={styles.matchLabel}>Match</span>
            </div>

            {/* Vehicle Image */}
            <div style={{ ...styles.vehicleImage, background: vehicle.gradient }}>
              <span style={styles.vehicleInitial}>{vehicle.model.charAt(0)}</span>
              <div style={styles.statusBadge}>
                <span style={{
                  ...styles.statusDot,
                  background: vehicle.status === 'In Stock' ? '#4ade80' : '#fbbf24',
                }} />
                {vehicle.status}
              </div>
            </div>

            {/* Vehicle Info */}
            <div style={styles.vehicleInfo}>
              <div style={styles.vehicleHeader}>
                <div>
                  <h3 style={styles.vehicleName}>{vehicle.year} {vehicle.model}</h3>
                  <p style={styles.vehicleTrim}>{vehicle.trim}</p>
                </div>
                <span style={styles.stockNumber}>STK# {vehicle.stockNumber}</span>
              </div>

              <div style={styles.vehicleColor}>
                <div style={{ ...styles.colorSwatch, background: vehicle.gradient }} />
                {vehicle.exteriorColor}
              </div>

              {/* Features */}
              <div style={styles.featureTags}>
                {vehicle.features.map((feature, idx) => (
                  <span key={idx} style={styles.featureTag}>{feature}</span>
                ))}
              </div>

              {/* Pricing */}
              <div style={styles.pricingSection}>
                <div style={styles.priceColumn}>
                  <span style={styles.priceLabel}>Your Price</span>
                  <span style={styles.priceValue}>${vehicle.salePrice.toLocaleString()}</span>
                </div>
                <div style={styles.paymentColumn}>
                  <span style={styles.priceLabel}>Est. Lease</span>
                  <span style={styles.paymentValue}>${vehicle.monthlyLease}/mo</span>
                </div>
              </div>

              <button style={styles.viewDetailsButton}>
                View Details
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Refine Search */}
      <div style={styles.refineSection}>
        <p style={styles.refineText}>Not seeing what you're looking for?</p>
        <button style={styles.refineButton} onClick={() => navigateTo('welcome')}>
          Start Over
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: '32px 40px',
    overflow: 'auto',
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {},
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  matchCount: {
    color: '#4ade80',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  sortSelect: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  vehicleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  vehicleCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '10px',
    backdropFilter: 'blur(8px)',
  },
  matchScore: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#4ade80',
  },
  matchLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  vehicleImage: {
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vehicleInitial: {
    fontSize: '72px',
    fontWeight: '800',
    color: 'rgba(255,255,255,0.2)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  vehicleInfo: {
    padding: '20px',
  },
  vehicleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  vehicleName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  vehicleTrim: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    margin: '2px 0 0 0',
  },
  stockNumber: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  vehicleColor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '12px',
  },
  colorSwatch: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  featureTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  featureTag: {
    padding: '4px 10px',
    background: 'rgba(27, 115, 64, 0.2)',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#4ade80',
  },
  pricingSection: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  priceColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  paymentColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
  },
  paymentValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#4ade80',
  },
  viewDetailsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  refineSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
  },
  refineText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  refineButton: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default InventoryResults;
