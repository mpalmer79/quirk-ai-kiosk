import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { inventoryAPI, recommendationsAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import LeadForm from '../components/LeadForm';

const FALLBACK_IMAGES = {
  corvette: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/2020_Chevrolet_Corvette_C8_rearview_cropped.jpg/800px-2020_Chevrolet_Corvette_C8_rearview_cropped.jpg',
  camaro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2019_Chevrolet_Camaro_2SS%2C_front_9.30.19.jpg/800px-2019_Chevrolet_Camaro_2SS%2C_front_9.30.19.jpg',
  silverado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2019_Chevrolet_Silverado_LT_Trail_Boss%2C_front_9.28.19.jpg/800px-2019_Chevrolet_Silverado_LT_Trail_Boss%2C_front_9.28.19.jpg',
  colorado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2021_Chevrolet_Colorado_ZR2_Midnight%2C_front_9.26.21.jpg/800px-2021_Chevrolet_Colorado_ZR2_Midnight%2C_front_9.26.21.jpg',
  tahoe: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg/800px-2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg',
  suburban: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/2021_Chevrolet_Suburban_High_Country%2C_front_2.27.21.jpg/800px-2021_Chevrolet_Suburban_High_Country%2C_front_2.27.21.jpg',
  traverse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/2018_Chevrolet_Traverse_High_Country%2C_front_7.2.18.jpg/800px-2018_Chevrolet_Traverse_High_Country%2C_front_7.2.18.jpg',
  equinox: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/2022_Chevrolet_Equinox_RS_AWD_in_Mosaic_Black_Metallic%2C_Front_Left%2C_01-22-2022.jpg/800px-2022_Chevrolet_Equinox_RS_AWD_in_Mosaic_Black_Metallic%2C_Front_Left%2C_01-22-2022.jpg',
  trailblazer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/2021_Chevrolet_Trailblazer_RS_AWD_in_Zeus_Bronze_Metallic%2C_Front_Left%2C_11-06-2020.jpg/800px-2021_Chevrolet_Trailblazer_RS_AWD_in_Zeus_Bronze_Metallic%2C_Front_Left%2C_11-06-2020.jpg',
  trax: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2024_Chevrolet_Trax_2RS_in_Cacti_Green%2C_Front_Left%2C_06-15-2023.jpg/800px-2024_Chevrolet_Trax_2RS_in_Cacti_Green%2C_Front_Left%2C_06-15-2023.jpg',
  blazer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/2019_Chevrolet_Blazer_RS_AWD%2C_front_9.1.19.jpg/800px-2019_Chevrolet_Blazer_RS_AWD%2C_front_9.1.19.jpg',
  malibu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/2019_Chevrolet_Malibu_RS%2C_front_11.3.19.jpg/800px-2019_Chevrolet_Malibu_RS%2C_front_11.3.19.jpg',
  bolt: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/2017_Chevrolet_Bolt_EV_Premier_in_Kinetic_Blue_Metallic%2C_front_left.jpg/800px-2017_Chevrolet_Bolt_EV_Premier_in_Kinetic_Blue_Metallic%2C_front_left.jpg',
  express: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Chevrolet_Express_%28facelift%29.jpg/800px-Chevrolet_Express_%28facelift%29.jpg',
  default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg/800px-2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg'
};

function getFallbackImage(model) {
  if (!model) return FALLBACK_IMAGES.default;
  var m = model.toLowerCase();
  if (m.indexOf('corvette') >= 0) return FALLBACK_IMAGES.corvette;
  if (m.indexOf('camaro') >= 0) return FALLBACK_IMAGES.camaro;
  if (m.indexOf('silverado') >= 0) return FALLBACK_IMAGES.silverado;
  if (m.indexOf('colorado') >= 0) return FALLBACK_IMAGES.colorado;
  if (m.indexOf('tahoe') >= 0) return FALLBACK_IMAGES.tahoe;
  if (m.indexOf('suburban') >= 0) return FALLBACK_IMAGES.suburban;
  if (m.indexOf('traverse') >= 0) return FALLBACK_IMAGES.traverse;
  if (m.indexOf('equinox') >= 0) return FALLBACK_IMAGES.equinox;
  if (m.indexOf('trailblazer') >= 0) return FALLBACK_IMAGES.trailblazer;
  if (m.indexOf('trax') >= 0) return FALLBACK_IMAGES.trax;
  if (m.indexOf('blazer') >= 0) return FALLBACK_IMAGES.blazer;
  if (m.indexOf('malibu') >= 0) return FALLBACK_IMAGES.malibu;
  if (m.indexOf('bolt') >= 0) return FALLBACK_IMAGES.bolt;
  if (m.indexOf('express') >= 0) return FALLBACK_IMAGES.express;
  return FALLBACK_IMAGES.default;
}

function VehicleDetailPage() {
  const { id } = useParams();
  const { trackVehicleView } = useKiosk();
  const [vehicle, setVehicle] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormType, setLeadFormType] = useState('general');

  useEffect(function() {
    if (id) {
      loadVehicle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  var loadVehicle = async function() {
    try {
      setLoading(true);
      var response = await inventoryAPI.getById(id);
      setVehicle(response.data);
      trackVehicleView(id);
      loadRecommendations(id);
      setError(null);
    } catch (err) {
      console.error('Error loading vehicle:', err);
      setError('Vehicle not found');
    } finally {
      setLoading(false);
    }
  };

  var loadRecommendations = async function(vehicleId) {
    try {
      var response = await recommendationsAPI.getForVehicle(vehicleId, 4);
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  var openLeadForm = function(type) {
    setLeadFormType(type);
    setShowLeadForm(true);
  };

  var handleImageError = function(e) {
    if (!vehicle) return;
    var fallbackUrl = getFallbackImage(vehicle.model);
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Vehicle Not Found</h2>
        <p style={styles.errorText}>
          This vehicle may have been sold or is no longer available.
        </p>
      </div>
    );
  }

  var savings = vehicle.msrp ? vehicle.msrp - vehicle.price : 0;
  var vehicleAlt = vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model;

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={styles.mainContent}>
        <div style={styles.gallerySection}>
          <div style={styles.mainImage}>
            <img
              src={vehicle.imageUrl}
              alt={vehicleAlt}
              style={styles.image}
              onError={handleImageError}
            />
            {savings > 500 && (
              <div style={styles.savingsBadge}>
                Save ${savings.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.header}>
            <span style={styles.year}>{vehicle.year}</span>
            <span style={styles.stockNumber}>Stock #{vehicle.stockNumber}</span>
          </div>

          <h1 style={styles.title}>
            {vehicle.make} {vehicle.model}
          </h1>
          <p style={styles.trim}>{vehicle.trim}</p>

          <div style={styles.priceSection}>
            <span style={styles.price}>
              ${vehicle.price.toLocaleString()}
            </span>
            {vehicle.msrp && vehicle.msrp > vehicle.price && (
              <span style={styles.msrp}>
                MSRP ${vehicle.msrp.toLocaleString()}
              </span>
            )}
          </div>

          <div style={styles.statusBadge}>
            {vehicle.status}
          </div>

          <div style={styles.specsGrid}>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Engine</span>
              <span style={styles.specValue}>{vehicle.engine}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Transmission</span>
              <span style={styles.specValue}>{vehicle.transmission}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Drivetrain</span>
              <span style={styles.specValue}>{vehicle.drivetrain}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Fuel Type</span>
              <span style={styles.specValue}>{vehicle.fuelType}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Exterior</span>
              <span style={styles.specValue}>{vehicle.exteriorColor}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Interior</span>
              <span style={styles.specValue}>{vehicle.interiorColor}</span>
            </div>
            {vehicle.mpgCity && vehicle.mpgHighway && (
              <div style={styles.specItem}>
                <span style={styles.specLabel}>Fuel Economy</span>
                <span style={styles.specValue}>
                  {vehicle.mpgCity}/{vehicle.mpgHighway} MPG
                </span>
              </div>
            )}
            {vehicle.evRange && (
              <div style={styles.specItem}>
                <span style={styles.specLabel}>EV Range</span>
                <span style={styles.specValue}>{vehicle.evRange} miles</span>
              </div>
            )}
          </div>

          {vehicle.features && vehicle.features.length > 0 && (
            <div style={styles.featuresSection}>
              <h3 style={styles.featuresTitle}>Key Features</h3>
              <div style={styles.featuresList}>
                {vehicle.features.map(function(feature, index) {
                  return (
                    <span key={index} style={styles.featureTag}>
                      {feature}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={styles.vinSection}>
            <span style={styles.vinLabel}>VIN:</span>
            <span style={styles.vinValue}>{vehicle.vin}</span>
          </div>

          <div style={styles.ctaSection}>
            <button
              style={styles.primaryButton}
              onClick={function() { openLeadForm('test-drive'); }}
            >
              Schedule Test Drive
            </button>
            <button
              style={styles.secondaryButton}
              onClick={function() { openLeadForm('info'); }}
            >
              Request More Info
            </button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section style={styles.recommendationsSection}>
          <h2 style={styles.recommendationsTitle}>
            You Might Also Like
          </h2>
          <div style={styles.recommendationsGrid}>
            {recommendations.map(function(rec) {
              return <VehicleCard key={rec.id} vehicle={rec} />;
            })}
          </div>
        </section>
      )}

      <LeadForm
        isOpen={showLeadForm}
        onClose={function() { setShowLeadForm(false); }}
        vehicle={vehicle}
        formType={leadFormType}
      />
    </motion.div>
  );
}

const styles = {
  container: {
    paddingBottom: '48px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #2a2a2a',
    borderTopColor: '#1a472a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#a0a0a0'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '64px 24px'
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '12px'
  },
  errorText: {
    color: '#a0a0a0'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 450px',
    gap: '32px',
    marginBottom: '48px'
  },
  gallerySection: {
    width: '100%'
  },
  mainImage: {
    position: 'relative',
    width: '100%',
    height: '450px',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#141414'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  savingsBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    background: '#22c55e',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: 700
  },
  infoSection: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #2a2a2a'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  year: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#c9a227'
  },
  stockNumber: {
    fontSize: '0.875rem',
    color: '#666666'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px'
  },
  trim: {
    fontSize: '1.125rem',
    color: '#a0a0a0',
    marginBottom: '16px'
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '12px'
  },
  price: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  msrp: {
    fontSize: '1rem',
    color: '#666666',
    textDecoration: 'line-through'
  },
  statusBadge: {
    display: 'inline-block',
    background: 'rgba(26, 71, 42, 0.3)',
    color: '#2d5a3d',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '24px'
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  specItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  specLabel: {
    fontSize: '0.75rem',
    color: '#666666',
    textTransform: 'uppercase'
  },
  specValue: {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#ffffff'
  },
  featuresSection: {
    marginBottom: '24px'
  },
  featuresTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#a0a0a0',
    marginBottom: '12px'
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  featureTag: {
    background: '#242424',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#a0a0a0'
  },
  vinSection: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: '#141414',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  vinLabel: {
    fontSize: '0.875rem',
    color: '#666666'
  },
  vinValue: {
    fontSize: '0.875rem',
    color: '#a0a0a0',
    fontFamily: 'monospace'
  },
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  primaryButton: {
    width: '100%',
    padding: '16px',
    background: '#1a472a',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1.125rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  secondaryButton: {
    width: '100%',
    padding: '16px',
    background: '#242424',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1.125rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  recommendationsSection: {
    marginTop: '48px'
  },
  recommendationsTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px'
  },
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  }
};

export default VehicleDetailPage;
