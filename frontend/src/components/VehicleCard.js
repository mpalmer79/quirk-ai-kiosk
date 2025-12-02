import React, { useState } from 'react';

// Wikimedia Commons fallback images for each model
const FALLBACK_IMAGES = {
  corvette: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/2020_Chevrolet_Corvette_C8_in_Torch_Red%2C_front_left.jpg/800px-2020_Chevrolet_Corvette_C8_in_Torch_Red%2C_front_left.jpg',
  camaro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2019_Chevrolet_Camaro_2SS%2C_front_6.28.19.jpg/800px-2019_Chevrolet_Camaro_2SS%2C_front_6.28.19.jpg',
  silverado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2019_Chevrolet_Silverado_1500_High_Country_Deluxe%2C_front_7.4.19.jpg/800px-2019_Chevrolet_Silverado_1500_High_Country_Deluxe%2C_front_7.4.19.jpg',
  'silverado 1500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2019_Chevrolet_Silverado_1500_High_Country_Deluxe%2C_front_7.4.19.jpg/800px-2019_Chevrolet_Silverado_1500_High_Country_Deluxe%2C_front_7.4.19.jpg',
  'silverado 2500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg/800px-2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg',
  'silverado 2500hd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg/800px-2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg',
  'silverado 3500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg/800px-2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg',
  'silverado 3500hd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg/800px-2020_Chevrolet_Silverado_2500HD_LTZ_Z71%2C_front_12.14.19.jpg',
  colorado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/2021_Chevrolet_Colorado_Z71_Crew_Cab%2C_front_3.16.21.jpg/800px-2021_Chevrolet_Colorado_Z71_Crew_Cab%2C_front_3.16.21.jpg',
  tahoe: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg/800px-2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg',
  suburban: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/2021_Chevrolet_Suburban_High_Country%2C_front_1.5.21.jpg/800px-2021_Chevrolet_Suburban_High_Country%2C_front_1.5.21.jpg',
  traverse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2018_Chevrolet_Traverse_High_Country_3.6L_front_3.16.18.jpg/800px-2018_Chevrolet_Traverse_High_Country_3.6L_front_3.16.18.jpg',
  equinox: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2022_Chevrolet_Equinox_RS_AWD_in_Midnight_Blue_Metallic%2C_Front_Left%2C_11-20-2021.jpg/800px-2022_Chevrolet_Equinox_RS_AWD_in_Midnight_Blue_Metallic%2C_Front_Left%2C_11-20-2021.jpg',
  trailblazer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/2021_Chevrolet_Trailblazer_RS_AWD_in_Zeus_Bronze_Metallic%2C_Front_Left%2C_11-06-2020.jpg/800px-2021_Chevrolet_Trailblazer_RS_AWD_in_Zeus_Bronze_Metallic%2C_Front_Left%2C_11-06-2020.jpg',
  trax: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2024_Chevrolet_Trax_2RS_in_Cacti_Green%2C_Front_Left%2C_06-15-2023.jpg/800px-2024_Chevrolet_Trax_2RS_in_Cacti_Green%2C_Front_Left%2C_06-15-2023.jpg',
  blazer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/2019_Chevrolet_Blazer_RS_AWD%2C_front_9.1.19.jpg/800px-2019_Chevrolet_Blazer_RS_AWD%2C_front_9.1.19.jpg',
  malibu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/2019_Chevrolet_Malibu_RS%2C_front_11.3.19.jpg/800px-2019_Chevrolet_Malibu_RS%2C_front_11.3.19.jpg',
  bolt: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/2017_Chevrolet_Bolt_EV_Premier_in_Kinetic_Blue_Metallic%2C_front_left.jpg/800px-2017_Chevrolet_Bolt_EV_Premier_in_Kinetic_Blue_Metallic%2C_front_left.jpg',
  express: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Chevrolet_Express_%28facelift%29.jpg/800px-Chevrolet_Express_%28facelift%29.jpg',
  default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg/800px-2021_Chevrolet_Tahoe_Z71%2C_front_8.16.20.jpg'
};

// Get fallback image based on model name
function getFallbackImage(model) {
  if (!model) return FALLBACK_IMAGES.default;
  
  const m = model.toLowerCase();
  
  // Check specific models first (more specific to less specific)
  if (m.includes('silverado 2500') || m.includes('silverado2500')) return FALLBACK_IMAGES['silverado 2500hd'];
  if (m.includes('silverado 3500') || m.includes('silverado3500')) return FALLBACK_IMAGES['silverado 3500hd'];
  if (m.includes('corvette')) return FALLBACK_IMAGES.corvette;
  if (m.includes('camaro')) return FALLBACK_IMAGES.camaro;
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

const VehicleCard = ({ vehicle, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(vehicle.imageUrl || getFallbackImage(vehicle.model));
  
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(getFallbackImage(vehicle.model));
    }
  };

  const savings = vehicle.msrp && vehicle.price ? vehicle.msrp - vehicle.price : 0;
  
  const formatPrice = (price) => {
    if (!price) return 'Call for Price';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSavings = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all duration-200 flex-shrink-0 w-72"
      onClick={() => onClick && onClick(vehicle)}
    >
      {/* Image Container */}
      <div className="relative h-44 bg-zinc-800">
        <img
          src={imageSrc}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Savings Badge */}
        {savings > 0 && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
            Save {formatSavings(savings)}
          </span>
        )}
        
        {/* Stock Badge */}
        <span className="absolute top-2 right-2 bg-zinc-800/90 text-white text-xs font-medium px-2 py-1 rounded border border-zinc-600">
          In Stock
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Year and Body Type */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-emerald-500 font-semibold text-sm">{vehicle.year}</span>
          <span className="text-zinc-500 text-xs uppercase tracking-wide">
            {vehicle.bodyType || vehicle.body || ''}
          </span>
        </div>
        
        {/* Make and Model */}
        <h3 className="text-white font-bold text-lg leading-tight mb-1">
          {vehicle.make} {vehicle.model}
        </h3>
        
        {/* Trim */}
        {vehicle.trim && (
          <p className="text-zinc-400 text-sm mb-2">{vehicle.trim}</p>
        )}
        
        {/* Drivetrain and Fuel */}
        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
          {vehicle.drivetrain && <span>{vehicle.drivetrain}</span>}
          {vehicle.drivetrain && vehicle.fuelType && <span>•</span>}
          {vehicle.fuelType && <span>{vehicle.fuelType}</span>}
        </div>
        
        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold text-xl">
            {formatPrice(vehicle.price)}
          </span>
          {vehicle.msrp && vehicle.msrp > vehicle.price && (
            <span className="text-zinc-500 text-sm line-through">
              MSRP {formatPrice(vehicle.msrp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
