import React from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGES = {
  corvette: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/2020_Chevrolet_Corvette_C8_rearview_cropped.jpg/800px-2020_Chevrolet_Corvette_C8_rearview_cropped.jpg',
  camaro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2019_Chevrolet_Camaro_2SS%2C_front_9.30.19.jpg/800px-2019_Chevrolet_Camaro_2SS%2C_front_9.30.19.jpg',
  silverado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2019_Chevrolet_Silverado_LT_Trail_Boss%2C_front_9.28.19.jpg/800px-2019_Chevrolet_Silverado_LT_Trail_Boss%2C_front_9.28.19.jpg',
  silverado_hd: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2020_Chevrolet_Silverado_2500HD_High_Country%2C_front_2.22.20.jpg/800px-2020_Chevrolet_Silverado_2500HD_High_Country%2C_front_2.22.20.jpg',
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
  const m = model.toLowerCase();
  if (m.includes('corvette')) return FALLBACK_IMAGES.corvette;
  if (m.includes('camaro')) return FALLBACK_IMAGES.camaro;
  if (m.includes('silverado') && (m.includes('2500') || m.includes('3500'))) return FALLBACK_IMAGES.silverado_hd;
  if (m.includes('silverado')) return FALLBACK_IMAGES.silverado;
  if (m.includes('colorado')) return FALLBACK_IMAGES.colorado;
  if (m.includes('tahoe')) return FALLBACK_IMAGES.tahoe;
  if (m.includes('suburban')) return FALLBACK_IMAGES.suburban;
  if (m.includes('traverse')) return FALLBACK_IMAGES.traverse;
  if (m.includes('equinox')) return FALLBACK_IMAGES.equinox;
  if (m.includes('trailblazer')) return FALLBACK_IMAGES.trailblazer;
  if (m.includes('trax')) return FALLBACK_IMAGES.trax;
  if (m.includes('blazer')) return FALLBACK_IMAGES.blazer;
  if (m.includes('malibu')) return FALLBACK_IMAGES.malibu;
  if (m.includes('bolt')) return FALLBACK_IMAGES.bolt;
  if (m.includes('express')) return FALLBACK_IMAGES.express;
  return FALLBACK_IMAGES.default;
}

function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vehicle/${vehicle.id}`);
  };

  const handleImageError = (e) => {
    const fallbackUrl = getFallbackImage(vehicle.model);
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  const savings = vehicle.msrp ? vehicle.msrp - vehicle.price : 0;

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.imageContainer}>
        <img
          src={vehicle.imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          style={styles.image}
          onError={handleImageError}
        />
        {savings > 500 && (
          <div style={styles.savingsBadge}>
            Save ${savings.toLocaleString()}
          </div>
        )}
        <div style={styles.statusBadge}>{vehicle.status}</div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.year}>{vehicle.year}</span>
          <span style={styles.bodyStyle}>{vehicle.bodyStyle}</span>
        </div>

        <h3 style={styles.title}>
          {vehicle.make} {vehicle.model}
        </h3>
        <p style={styles.trim}>{vehicle.trim}</p>

        <div style={styles.specs}>
          <span style={styles.spec}>{vehicle.drivetrain}</span>
          <span style={styles.specDot}>•</span>
          <span style={styles.spec}>{vehicle.fuelType}</span>
          {vehicle.cabStyle && (
            <>
              <span style={styles.specDot}>•</span>
              <span style={styles.spec}>{vehicle.cabStyle}</span>
            </>
          )}
        </div>

        <div style={styles.priceRow}>
          <span style={styles.price}>${vehicle.price.toLocaleString()}</span>
          {vehicle.msrp && vehicle.msrp > vehicle.price && (
            <span style={styles.msrp}>MSRP ${vehicle.msrp.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#1a1a1a',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #2a2a2a',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
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
  bodyStyle: {
    fontSize: '0.75rem',
    color: '#666666',
    textTransform: 'uppercase',
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
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  spec: {
    fontSize: '0.75rem',
    color: '#666666',
  },
  specDot: {
    fontSize: '0.75rem',
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
    fontSize: '0.875rem',
    color: '#666666',
    textDecoration: 'line-through',
  },
};

export default VehicleCard;
