import React from 'react';
import type { Vehicle } from '../types';
import { styles } from '../styles';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onClick }) => {
  // Show MSRP (not discounted sale price) on vehicle tiles
  const price = vehicle.msrp || vehicle.MSRP || vehicle.salePrice || vehicle.sale_price || vehicle.price || 0;
  const stock = vehicle.stockNumber || vehicle.stock_number || '';
  const color = vehicle.exteriorColor || vehicle.exterior_color || '';
  
  return (
    <button
      style={styles.vehicleCard}
      onClick={onClick}
    >
      <div style={styles.vehicleInfo}>
        <span style={styles.vehicleYear}>{vehicle.year} • Stock #{stock}</span>
        <span style={styles.vehicleModel}>{vehicle.model}</span>
        <span style={styles.vehicleTrim}>{vehicle.trim}</span>
      </div>
      <div style={styles.vehicleDetails}>
        <span style={styles.vehicleColor}>{color}</span>
        <span style={styles.vehiclePrice}>${price.toLocaleString()}</span>
      </div>
      <span style={styles.viewButton}>View Details →</span>
    </button>
  );
};

export default VehicleCard;
