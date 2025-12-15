/**
 * Vehicle Helper Utilities
 * Shared functions for vehicle image URLs, VIN decoding, and color handling
 */

import type { Vehicle } from '../types';

/**
 * Registry of available stock vehicle images in /public/images/vehicles/
 * Format: {model}-{color}.jpg
 * 
 * To add new images:
 * 1. Add the image file to frontend/public/images/vehicles/ with naming: {model}-{color}.jpg
 * 2. Add the model and color to this registry
 */
export const AVAILABLE_VEHICLE_IMAGES: Record<string, string[]> = {
  'corvette': ['black', 'red', 'white', 'yellow'],
  'equinox': ['black', 'blue', 'gray', 'green', 'red', 'white'],
  'trailblazer': ['white'],
};

/**
 * Check if we have a local image for this model/color combination
 */
export const hasLocalImage = (model: string, color: string): boolean => {
  const modelKey = model.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-?ev$/i, '')  // Handle both "equinox-ev" and "equinoxev"
    .replace(/-?hd$/i, '')  // Handle both "silverado-hd" and "silveradohd"
    .replace(/\d+$/, '');
  
  const colorCategory = getColorCategory(color);
  return AVAILABLE_VEHICLE_IMAGES[modelKey]?.includes(colorCategory) || false;
};

/**
 * Get the local image path for a vehicle if available
 */
export const getLocalImagePath = (model: string, color: string): string | null => {
  const modelKey = model.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-?ev$/i, '')  // Handle both "equinox-ev" and "equinoxev"
    .replace(/-?hd$/i, '')  // Handle both "silverado-hd" and "silveradohd"
    .replace(/\d+$/, '');
  
  const colorCategory = getColorCategory(color);
  
  if (AVAILABLE_VEHICLE_IMAGES[modelKey]?.includes(colorCategory)) {
    return `/images/vehicles/${modelKey}-${colorCategory}.jpg`;
  }
  
  return null;
};

// GM Truck VIN Decoder - extracts cab type and drive type for Silverado models
export interface TruckVINInfo {
  cabType: string;
  driveType: string;
}

/**
 * Decode GM truck VIN to extract cab type and drive type
 * Works for Silverado 1500, 2500, and 3500 models
 */
export const decodeGMTruckVIN = (vin: string, model: string): TruckVINInfo | null => {
  if (!vin || vin.length !== 17) return null;
  
  // Only decode for Silverado models
  const modelLower = (model || '').toLowerCase();
  if (!modelLower.includes('silverado')) return null;
  
  const vinUpper = vin.toUpperCase();
  
  // GM Silverado VIN Structure (2019+):
  // Position 6 (index 5) - Cab type
  // Position 7 (index 6) - Drive type
  const cabCode = vinUpper[5];
  const driveCode = vinUpper[6];
  
  // Cab type mapping for Silverado
  let cabType = '';
  switch (cabCode) {
    case 'A':
    case 'B':
      cabType = 'Regular Cab';
      break;
    case 'C':
    case 'D':
      cabType = 'Double Cab';
      break;
    case 'K':
    case 'U':
    case 'G':
      cabType = 'Crew Cab';
      break;
    default:
      cabType = '';
  }
  
  // Drive type mapping for GM trucks
  let driveType = '';
  switch (driveCode) {
    case 'E':
    case 'K':
    case 'G':
    case 'J':
      driveType = '4WD';
      break;
    case 'A':
    case 'D':
    case 'C':
    case 'B':
      driveType = '2WD';
      break;
    default:
      driveType = '';
  }
  
  if (cabType || driveType) {
    return { cabType, driveType };
  }
  
  return null;
};

/**
 * Map color descriptions to base color categories for image matching
 */
export const getColorCategory = (colorDesc: string): string => {
  const color = colorDesc.toLowerCase();
  if (color.includes('black')) return 'black';
  if (color.includes('white') || color.includes('summit') || color.includes('arctic') || color.includes('polar')) return 'white';
  if (color.includes('red') || color.includes('cherry') || color.includes('cajun') || color.includes('radiant') || color.includes('mist')) return 'red';
  if (color.includes('blue') || color.includes('northsky') || color.includes('glacier') || color.includes('reef')) return 'blue';
  if (color.includes('silver') || color.includes('sterling')) return 'silver';
  if (color.includes('gray') || color.includes('grey') || color.includes('shadow')) return 'gray';
  if (color.includes('green') || color.includes('woodland')) return 'green';
  if (color.includes('orange') || color.includes('tangier')) return 'orange';
  if (color.includes('yellow') || color.includes('accelerate') || color.includes('competition')) return 'yellow';
  if (color.includes('brown') || color.includes('harvest')) return 'brown';
  return '';
};

/**
 * Generate gradient background based on vehicle color
 */
export const getColorGradient = (color?: string): string => {
  const colorMap: Record<string, string> = {
    'white': 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    'black': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    'red': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    'blue': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    'silver': 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    'gray': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    'green': 'linear-gradient(135deg, #16a34a 0%, #166534 100%)',
    'orange': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    'yellow': 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    'brown': 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
  };
  
  const lowerColor = (color || '').toLowerCase();
  const category = getColorCategory(lowerColor);
  return colorMap[category] || 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
};

/**
 * Build image URL candidates for a vehicle based on model and color rules
 * Priority: API URL > Stock-specific > Model+Color > Base Model+Color > Model-only
 */
export const getVehicleImageCandidates = (vehicle: Vehicle, exteriorColor: string): string[] => {
  const candidates: string[] = [];
  const stockNumber = vehicle.stockNumber || vehicle.stock_number || '';
  
  // 1. First check API-provided URLs
  if (vehicle.imageUrl) candidates.push(vehicle.imageUrl);
  if (vehicle.image_url) candidates.push(vehicle.image_url);
  if (vehicle.images && vehicle.images.length > 0) {
    candidates.push(...vehicle.images);
  }
  
  // Normalize model for file matching
  const fullModel = (vehicle.model || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  // Get base model without EV/HD/etc suffixes for fallback (equinox-ev -> equinox)
  const baseModel = fullModel.replace(/-ev$/, '').replace(/-hd$/, '').replace(/\d+$/, '');
  const colorCategory = getColorCategory(exteriorColor);
  
  // 2. Stock-specific image (for featured/special vehicles)
  if (stockNumber) {
    candidates.push(`/images/vehicles/${stockNumber}.jpg`);
  }
  
  // 3. Full Model + Color combination (e.g., equinox-ev-gray.jpg)
  if (fullModel && colorCategory) {
    candidates.push(`/images/vehicles/${fullModel}-${colorCategory}.jpg`);
  }
  
  // 4. Base Model + Color (e.g., equinox-gray.jpg for Equinox EV)
  if (baseModel && baseModel !== fullModel && colorCategory) {
    candidates.push(`/images/vehicles/${baseModel}-${colorCategory}.jpg`);
  }
  
  // 5. Model-only fallback (e.g., equinox.jpg)
  if (fullModel) {
    candidates.push(`/images/vehicles/${fullModel}.jpg`);
  }
  if (baseModel && baseModel !== fullModel) {
    candidates.push(`/images/vehicles/${baseModel}.jpg`);
  }
  
  return candidates;
};

/**
 * Get single vehicle image URL (for inventory listings)
 * Priority: API URL > Local stock photo > null (will use gradient fallback)
 */
export const getVehicleImageUrl = (vehicle: Vehicle): string | null => {
  // Check for API-provided URLs first
  if (vehicle.imageUrl) return vehicle.imageUrl;
  if (vehicle.image_url) return vehicle.image_url;
  if (vehicle.images && vehicle.images.length > 0) return vehicle.images[0];
  
  // Try local stock photo matching
  const exteriorColor = vehicle.exteriorColor || vehicle.exterior_color || '';
  const model = vehicle.model || '';
  
  const localPath = getLocalImagePath(model, exteriorColor);
  if (localPath) return localPath;
  
  return null;
};
