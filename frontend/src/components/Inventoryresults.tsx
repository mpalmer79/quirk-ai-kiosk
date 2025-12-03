import React, { useState, useEffect } from 'react';
import api from './api';

const InventoryResults = ({ navigateTo, updateCustomerData, customerData }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(customerData?.sortBy || 'recommended');

  // Generate Quirk Chevy NH website URL for a vehicle
  const generateDealerUrl = (vehicle) => {
    const baseUrl = 'https://www.quirkchevynh.com/inventory/';
    
    // Helper to slugify text (lowercase, replace spaces with hyphens)
    const slugify = (text) => {
      if (!text) return '';
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w-]/g, '')         // Remove special characters except hyphens
        .replace(/--+/g, '-')           // Replace multiple hyphens with single
        .replace(/^-+/, '')             // Trim hyphens from start
        .replace(/-+$/, '');            // Trim hyphens from end
    };
    
    // Build URL components
    const condition = 'new'; // All inventory appears to be new
    const year = vehicle.year || '2026';
    const make = 'chevrolet';
    const model = slugify(vehicle.model || '');
    const trim = slugify(vehicle.trim || '');
    const drivetrain = slugify(vehicle.drivetrain || vehicle.driveTrain || '4wd');
    const bodyType = slugify(vehicle.cabType || vehicle.bodyStyle || vehicle.body || '');
    const vin = (vehicle.vin || vehicle.VIN || '').toLowerCase();
    
    // Construct URL: new-year-chevrolet-model-trim-drivetrain-bodytype-vin
    const urlParts = [condition, year, make, model, trim, drivetrain, bodyType, vin]
      .filter(part => part && part.length > 0); // Remove empty parts
    
    return baseUrl + urlParts.join('-') + '/';
  };

  // Handle vehicle card click - open dealership website
  const handleVehicleClick = (vehicle) => {
    const dealerUrl = generateDealerUrl(vehicle);
    window.open(dealerUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        
        // Build filter params based on customer selections
        const params = {};
        
        if (customerData.selectedModel) {
          params.model = customerData.selectedModel;
        }
        
        if (customerData.budgetRange) {
          // Convert monthly payment to rough vehicle price
          params.minPrice = customerData.budgetRange.min * 60;
          params.maxPrice = customerData.budgetRange.max * 80;
        }
        
        if (customerData.selectedCab) {
          params.cabType = customerData.selectedCab;
        }
        
        if (customerData.preferences?.bodyStyle) {
          params.bodyType = customerData.preferences.bodyStyle;
        }
        
        data = await api.getInventory(params);
        
        // Handle different response formats
        let vehicleList = data?.vehicles || data || [];
        
        // CLIENT-SIDE EXACT MODEL FILTERING
        // Backend may do partial/fuzzy matching, so we enforce strict model match here
        if (customerData.selectedModel) {
          const targetModel = customerData.selectedModel.toLowerCase().trim();
          
          vehicleList = vehicleList.filter(vehicle => {
            // Get vehicle model - try various field names
            const rawModel = vehicle.model || vehicle.Model || vehicle.modelName || '';
            const vehicleModel = rawModel.toLowerCase().trim();
            
            // Check for exact match or model at start of string
            // "Silverado 1500" should match "Silverado 1500" and "Silverado 1500 LT"
            // but NOT "Silverado 2500HD" or "Tahoe"
            if (vehicleModel === targetModel) return true;
            if (vehicleModel.startsWith(targetModel + ' ')) return true;
            if (vehicleModel.startsWith(targetModel)) {
              // Make sure next char isn't a digit (to prevent 1500 matching 15000)
              const nextChar = vehicleModel.charAt(targetModel.length);
              return !nextChar || nextChar === ' ' || !/\d/.test(nextChar);
            }
            return false;
          });
        }
        
        // Filter by cab type if specified
        if (customerData.selectedCab) {
          const targetCab = customerData.selectedCab.toLowerCase();
          vehicleList = vehicleList.filter(vehicle => {
            const cab = (vehicle.cabType || vehicle.cab || vehicle.body || vehicle.bodyStyle || '').toLowerCase();
            // Match first word: "crew" from "Crew Cab"
            const cabKeyword = targetCab.split(' ')[0];
            return cab.includes(cabKeyword);
          });
        }
        
        // Sort by color preferences if provided (1st choice best, then 2nd, then 3rd)
        if (customerData.colorPreferences?.length > 0) {
          const colorPrefs = customerData.colorPreferences.map(c => c.toLowerCase());
          vehicleList = vehicleList.sort((a, b) => {
            const aColor = (a.exteriorColor || a.color || '').toLowerCase();
            const bColor = (b.exteriorColor || b.color || '').toLowerCase();
            
            // Find which preference each color matches (0=1st, 1=2nd, 2=3rd, -1=no match)
            const getMatchIndex = (color) => {
              for (let i = 0; i < colorPrefs.length; i++) {
                // Match first word of color preference
                const keyword = colorPrefs[i].split(' ')[0];
                if (color.includes(keyword)) return i;
              }
              return 999; // No match goes to end
            };
            
            return getMatchIndex(aColor) - getMatchIndex(bColor);
          });
        }
        
        setVehicles(vehicleList);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setError('Unable to load inventory. Please try again.');
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [customerData]);

  // Generate gradient based on color
  const getGradient = (color) => {
    const colorMap = {
      'white': 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
      'black': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      'red': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      'blue': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      'silver': 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
      'gray': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      'beige': 'linear-gradient(135deg, #d4b896 0%, #a78b6c 100%)',
      'cypress': 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      'polar': 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
    };
    const lowerColor = (color || '').toLowerCase();
    return Object.entries(colorMap).find(([key]) => lowerColor.includes(key))?.[1] 
      || 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
  };

  // Format price without decimals
  const formatPrice = (price) => {
    return Math.round(price || 0).toLocaleString();
  };

  // Apply additional client-side filtering as a safety net
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!customerData.selectedModel) return true; // No filter if no model selected
    
    const targetModel = customerData.selectedModel.toLowerCase().trim();
    const vehicleModel = (vehicle.model || '').toLowerCase().trim();
    
    // Must match the selected model exactly (or with trim suffix)
    // "silverado 1500" matches "silverado 1500" or "silverado 1500 lt"
    // but NOT "silverado 2500hd" or "tahoe"
    return vehicleModel === targetModel || 
           vehicleModel.startsWith(targetModel + ' ') ||
           (vehicleModel.startsWith(targetModel) && !/\d/.test(vehicleModel.charAt(targetModel.length)));
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'priceLow': return (a.price || 0) - (b.price || 0);
      case 'priceHigh': return (b.price || 0) - (a.price || 0);
      case 'newest': return (b.year || 0) - (a.year || 0);
      default: return (b.matchScore || 50) - (a.matchScore || 50);
    }
  });

  // Get the appropriate title based on path
  const getTitle = () => {
    if (customerData.path === 'browse') return 'All Inventory';
    if (customerData.quizAnswers && Object.keys(customerData.quizAnswers).length > 0) {
      return 'Recommended For You';
    }
    if (customerData.selectedModel) return `${customerData.selectedModel} Inventory`;
    return 'All Inventory';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading inventory...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            {getTitle()}
            <span style={styles.matchCount}> ({filteredVehicles.length})</span>
          </h1>
          <p style={styles.subtitle}>
            {customerData.path === 'browse' 
              ? 'Browse our complete inventory' 
              : 'Sorted by best match based on your preferences'
            }
          </p>
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
      {sortedVehicles.length > 0 ? (
        <div style={styles.vehicleGrid}>
          {sortedVehicles.map((vehicle, index) => (
            <div 
              key={vehicle.id || vehicle.stockNumber || index}
              style={styles.vehicleCard}
              onClick={() => handleVehicleClick(vehicle)}
              title={`View on QuirkChevyNH.com`}
            >
              {/* Match Score - only show if from quiz */}
              {vehicle.matchScore && customerData.quizAnswers && (
                <div style={styles.matchBadge}>
                  <span style={styles.matchScore}>{vehicle.matchScore}%</span>
                  <span style={styles.matchLabel}>Match</span>
                </div>
              )}

              {/* Vehicle Image */}
              <div style={{ ...styles.vehicleImage, background: getGradient(vehicle.exteriorColor) }}>
                <span style={styles.vehicleInitial}>{(vehicle.model || 'V').charAt(0)}</span>
                <div style={styles.statusBadge}>
                  <span style={{
                    ...styles.statusDot,
                    background: vehicle.status === 'In Stock' ? '#4ade80' : '#fbbf24',
                  }} />
                  {vehicle.status || 'In Stock'}
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
                  <div style={{ ...styles.colorSwatch, background: getGradient(vehicle.exteriorColor) }} />
                  {vehicle.exteriorColor}
                </div>

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div style={styles.featureTags}>
                    {vehicle.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} style={styles.featureTag}>{feature}</span>
                    ))}
                  </div>
                )}

                {/* Pricing - MSRP on left, Your Price on right */}
                <div style={styles.pricingSection}>
                  <div style={styles.priceColumn}>
                    <span style={styles.priceLabel}>MSRP</span>
                    <span style={styles.msrpValue}>${formatPrice(vehicle.msrp || vehicle.price)}</span>
                  </div>
                  <div style={styles.paymentColumn}>
                    <span style={styles.priceLabel}>Your Price</span>
                    <span style={styles.paymentValue}>
                      ${formatPrice(vehicle.price)}
                    </span>
                  </div>
                </div>

                <button 
                  style={styles.viewDetailsButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVehicleClick(vehicle);
                  }}
                >
                  View Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noResults}>
          <div style={styles.noResultsIcon}>🔍</div>
          <h3 style={styles.noResultsTitle}>No vehicles match your criteria</h3>
          <p style={styles.noResultsText}>Try adjusting your filters or preferences</p>
        </div>
      )}

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
    minHeight: '100vh',
    maxHeight: '100vh',
    padding: '32px 40px',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
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
  errorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  errorIcon: {
    fontSize: '48px',
  },
  errorText: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.6)',
  },
  retryButton: {
    padding: '12px 24px',
    background: '#1B7340',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
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
    fontWeight: '500',
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
  msrpValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  paymentValue: {
    fontSize: '20px',
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
  noResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  noResultsIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  noResultsTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  noResultsText: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
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
