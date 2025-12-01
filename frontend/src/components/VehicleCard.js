import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vehicle/${vehicle.id}`);
  };

  const savings = vehicle.msrp ? vehicle.msrp - vehicle.price : 0;
  const hasSavings = savings > 500;

  return (
    <motion.div
      style={styles.card}
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={styles.imageContainer}>
        <img
          src={vehicle.imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          style={styles.image}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800';
          }}
        />
        {hasSavings && (
          <div style={styles.savingsBadge}>
            Save ${savings.toLocaleString()}
          </div>
        )}
        <div style={styles.statusBadge} data-status={vehicle.status}>
          {vehicle.status}
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.year}>{vehicle.year}</span>
          <span style={styles.stockNumber}>#{vehicle.stockNumber}</span>
        </div>

        <h3 style={styles.title}>
          {vehicle.make} {vehicle.model}
        </h3>

        <p style={styles.trim}>{vehicle.trim}</p>

        <div style={styles.specs}>
          <span style={styles.spec}>{vehicle.drivetrain}</span>
          <span style={styles.specDivider}>•</span>
          <span style={styles.spec}>{vehicle.fuelType}</span>
          <span style={styles.specDivider}>•</span>
          <span style={styles.spec}>{vehicle.engine}</span>
        </div>

        <div style={styles.priceRow}>
          <span style={styles.price}>
            ${vehicle.price.toLocaleString()}
          </span>
          {vehicle.msrp && vehicle.msrp > vehicle.price && (
            <span style={styles.msrp}>
              ${vehicle.msrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    background: '#1a1a1a',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    background: '#141414',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  savingsBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#22c55e',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  statusBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(26, 71, 42, 0.9)',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  content: {
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  year: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#c9a227',
  },
  stockNumber: {
    fontSize: '0.75rem',
    color: '#666666',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px',
  },
  trim: {
    fontSize: '0.875rem',
    color: '#a0a0a0',
    marginBottom: '12px',
  },
  specs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  spec: {
    fontSize: '0.75rem',
    color: '#666666',
  },
  specDivider: {
    color: '#444444',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  msrp: {
    fontSize: '1rem',
    color: '#666666',
    textDecoration: 'line-through',
  },
};

export default VehicleCard;
