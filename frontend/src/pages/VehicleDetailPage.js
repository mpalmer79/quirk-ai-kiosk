import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { inventoryAPI, recommendationsAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import LeadForm from '../components/LeadForm';

function VehicleDetailPage() {
  const { id } = useParams();
  const { trackVehicleView } = useKiosk();
  const [vehicle, setVehicle] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormType, setLeadFormType] = useState('general');

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getById(id);
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

  const loadRecommendations = async (vehicleId) => {
    try {
      const response = await recommendationsAPI.getForVehicle(vehicleId, 4);
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const openLeadForm = (type) => {
    setLeadFormType(type);
    setShowLeadForm(true);
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

  const savings = vehicle.msrp ? vehicle.msrp - vehicle.price : 0;

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={styles.mainContent}>
        {/* Gallery Section */}
        <div style={styles.gallerySection}>
          <div style={styles.mainImage}>
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={styles.image}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800';
              }}
            />
            {savings > 500 && (
              <div style={styles.savingsBadge}>
                Save ${savings.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
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

          {/* Specs Grid */}
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

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div style={styles.featuresSection}>
              <h3 style={styles.featuresTitle}>Key Features</h3>
              <div style={styles.featuresList}>
                {vehicle.features.map((feature, index) => (
                  <span key={index} style={styles.featureTag}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* VIN */}
          <div style={styles.vinSection}>
            <span style={styles.vinLabel}>VIN:</span>
            <span style={styles.vinValue}>{vehicle.vin}</span>
          </div>

          {/* CTA Buttons */}
          <div style={styles.ctaSection}>
            <button
              style={styles.primaryButton}
              onClick={() => openLeadForm('test-drive')}
            >
              🚗 Schedule Test Drive
            </button>
            <button
              style={styles.secondaryButton}
              onClick={() => openLeadForm('info')}
            >
              📋 Request More Info
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section style={styles.recommendationsSection}>
          <h2 style={styles.recommendationsTitle}>
            You Might Also Like
          </h2>
          <div style={styles.recommendationsGrid}>
            {recommendations.map((rec) => (
              <VehicleCard key={rec.id} vehicle={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Lead Form Modal */}
      <LeadForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        vehicle={vehicle}
        formType={leadFormType}
      />
    </motion.div>
  );
}

const styles = {
  container: {
    paddingBottom: '48px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #2a2a2a',
    borderTopColor: '#1a472a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#a0a0a0',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '64px 24px',
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '12px',
  },
  errorText: {
    color: '#a0a0a0',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 450px',
    gap: '32px',
    marginBottom: '48px',
  },
  gallerySection: {
    width: '100%',
  },
  mainImage: {
    position: 'relative',
    width: '100%',
    height: '450px',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#141414',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
    fontWeight: 700,
  },
  infoSection: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #2a2a2a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  year: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#c9a227',
  },
  stockNumber: {
    fontSize: '0.875rem',
    color: '#666666',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px',
  },
  trim: {
    fontSize: '1.125rem',
    color: '#a0a0a0',
    marginBottom: '16px',
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '12px',
  },
  price: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  msrp: {
    fontSize: '1rem',
    color: '#666666',
    textDecoration: 'line-through',
  },
  statusBadge: {
    display: 'inline-block',
    background: 'rgba(26, 71, 42, 0.3)',
    color: '#2d5a3d',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '24px',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  specItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  specLabel: {
    fontSize: '0.75rem',
    color: '#666666',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#ffffff',
  },
  featuresSection: {
    marginBottom: '24px',
  },
  featuresTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#a0a0a0',
    marginBottom: '12px',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  featureTag: {
    background: '#242424',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#a0a0a0',
  },
  vinSection: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: '#141414',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  vinLabel: {
    fontSize: '0.875rem',
    color: '#666666',
  },
  vinValue: {
    fontSize: '0.875rem',
    color: '#a0a0a0',
    fontFamily: 'monospace',
  },
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    gap: '8px',
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
    gap: '8px',
  },
  recommendationsSection: {
    marginTop: '48px',
  },
  recommendationsTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px',
  },
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
};

export default VehicleDetailPage;
