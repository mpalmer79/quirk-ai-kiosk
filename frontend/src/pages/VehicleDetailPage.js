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
                  {vehicle.mpgCi
