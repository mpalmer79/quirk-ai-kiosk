import React, { useState } from 'react';

const VehicleDetailPage = ({ vehicle, onBack, onStartChat }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">No vehicle selected</p>
      </div>
    );
  }

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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inventory
          </button>
          
          <span className="text-zinc-500 text-sm">Stock #{vehicle.stockNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative">
            <div className="aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden">
              {!imageError && vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-zinc-400 text-2xl font-semibold">{vehicle.make}</div>
                    <div className="text-zinc-500 text-xl">{vehicle.model}</div>
                    <div className="text-zinc-600 text-sm mt-2">{vehicle.trim}</div>
                  </div>
                </div>
              )}
            </div>
            
            {savings > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-lg">
                Save {formatSavings(savings)}
              </span>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <span className="text-emerald-500 font-semibold">{vehicle.year}</span>
              <h1 className="text-3xl font-bold mt-1">
                {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.trim && (
                <p className="text-zinc-400 text-xl mt-1">{vehicle.trim}</p>
              )}
            </div>

            {/* Price */}
            <div className="bg-zinc-900 rounded-xl p-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(vehicle.price)}
                </span>
                {vehicle.msrp && vehicle.msrp > vehicle.price && (
                  <span className="text-zinc-500 text-xl line-through">
                    MSRP {formatPrice(vehicle.msrp)}
                  </span>
                )}
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              {vehicle.exteriorColor && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Exterior</p>
                  <p className="text-white font-semibold">{vehicle.exteriorColor}</p>
                </div>
              )}
              {vehicle.interiorColor && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Interior</p>
                  <p className="text-white font-semibold">{vehicle.interiorColor}</p>
                </div>
              )}
              {vehicle.drivetrain && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Drivetrain</p>
                  <p className="text-white font-semibold">{vehicle.drivetrain}</p>
                </div>
              )}
              {vehicle.engine && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Engine</p>
                  <p className="text-white font-semibold">{vehicle.engine}</p>
                </div>
              )}
              {vehicle.transmission && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Transmission</p>
                  <p className="text-white font-semibold">{vehicle.transmission}</p>
                </div>
              )}
              {vehicle.fuelType && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Fuel Type</p>
                  <p className="text-white font-semibold">{vehicle.fuelType}</p>
                </div>
              )}
              {vehicle.mileage !== undefined && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">Mileage</p>
                  <p className="text-white font-semibold">
                    {vehicle.mileage?.toLocaleString() || 'New'}
                  </p>
                </div>
              )}
              {vehicle.vin && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-sm">VIN</p>
                  <p className="text-white font-semibold text-xs">{vehicle.vin}</p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={() => onStartChat && onStartChat(vehicle)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
              >
                Chat with AI Assistant
              </button>
              <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-zinc-700">
                Schedule Test Drive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
