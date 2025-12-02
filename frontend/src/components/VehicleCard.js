import React, { useState } from 'react';

const VehicleCard = ({ vehicle, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
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
        {!imageError && vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-zinc-400 text-lg font-semibold">{vehicle.make}</div>
              <div className="text-zinc-500 text-sm">{vehicle.model}</div>
            </div>
          </div>
        )}
        
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
