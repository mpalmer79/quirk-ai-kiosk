/**
 * Trade-In Vehicle Database
 * Comprehensive make/model list for trade-in value estimation
 * 
 * Usage:
 *   import { TRADE_IN_MAKES, getModelsForMake } from './tradeInVehicles';
 */

export const TRADE_IN_VEHICLES: Record<string, string[]> = {
  Acura: ['ILX', 'Integra', 'MDX', 'NSX', 'RDX', 'RLX', 'TLX', 'TSX', 'ZDX'],
  'Alfa Romeo': ['4C', 'Giulia', 'Stelvio', 'Tonale'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'e-tron', 'e-tron GT', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8', 'TT'],
  BMW: ['2 Series', '3 Series', '4 Series', '5 Series', '7 Series', '8 Series', 'i4', 'i5', 'i7', 'iX', 'M2', 'M3', 'M4', 'M5', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z4'],
  Buick: ['Enclave', 'Encore', 'Encore GX', 'Envision', 'Envista', 'LaCrosse', 'Regal', 'Verano'],
  Cadillac: ['CT4', 'CT5', 'CT6', 'Escalade', 'Escalade ESV', 'Lyriq', 'XT4', 'XT5', 'XT6'],
  Chevrolet: ['Blazer', 'Blazer EV', 'Bolt EUV', 'Bolt EV', 'Camaro', 'Colorado', 'Corvette', 'Equinox', 'Equinox EV', 'Express', 'Impala', 'Malibu', 'Silverado 1500', 'Silverado 2500HD', 'Silverado 3500HD', 'Silverado EV', 'Spark', 'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax'],
  Chrysler: ['300', 'Pacifica', 'Pacifica Hybrid', 'Voyager'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Hornet', 'Journey'],
  Ferrari: ['296 GTB', '296 GTS', '488', '812', 'F8', 'Portofino', 'Purosangue', 'Roma', 'SF90'],
  Fiat: ['500', '500L', '500X'],
  Ford: ['Bronco', 'Bronco Sport', 'E-Transit', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-150 Lightning', 'F-250', 'F-350', 'Maverick', 'Mustang', 'Mustang Mach-E', 'Ranger', 'Transit', 'Transit Connect'],
  Genesis: ['Electrified G80', 'Electrified GV70', 'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  GMC: ['Acadia', 'Canyon', 'Hummer EV', 'Savana', 'Sierra 1500', 'Sierra 2500HD', 'Sierra 3500HD', 'Terrain', 'Yukon', 'Yukon XL'],
  Honda: ['Accord', 'Accord Hybrid', 'Civic', 'Civic Hybrid', 'CR-V', 'CR-V Hybrid', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Prologue', 'Ridgeline'],
  Hyundai: ['Accent', 'Elantra', 'Elantra Hybrid', 'Elantra N', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Kona Electric', 'Kona N', 'Nexo', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Santa Fe Hybrid', 'Sonata', 'Sonata Hybrid', 'Tucson', 'Tucson Hybrid', 'Veloster', 'Venue'],
  Infiniti: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
  Jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XE', 'XF'],
  Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Cherokee 4xe', 'Grand Cherokee L', 'Grand Wagoneer', 'Renegade', 'Wagoneer', 'Wrangler', 'Wrangler 4xe'],
  Kia: ['Carnival', 'EV6', 'EV9', 'Forte', 'K5', 'Niro', 'Niro EV', 'Rio', 'Seltos', 'Sorento', 'Sorento Hybrid', 'Soul', 'Sportage', 'Sportage Hybrid', 'Stinger', 'Telluride'],
  Lamborghini: ['Huracan', 'Revuelto', 'Urus'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  Lexus: ['ES', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'RZ', 'TX', 'UX'],
  Lincoln: ['Aviator', 'Corsair', 'MKC', 'MKZ', 'Nautilus', 'Navigator'],
  Lucid: ['Air'],
  Maserati: ['Ghibli', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'],
  Mazda: ['CX-30', 'CX-5', 'CX-50', 'CX-70', 'CX-90', 'Mazda3', 'Mazda6', 'MX-5 Miata', 'MX-30'],
  McLaren: ['720S', '750S', 'Artura', 'GT'],
  'Mercedes-Benz': ['A-Class', 'AMG GT', 'C-Class', 'CLA', 'CLE', 'CLS', 'E-Class', 'EQB', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Maybach', 'S-Class', 'SL', 'Sprinter'],
  Mini: ['Clubman', 'Convertible', 'Countryman', 'Hardtop 2 Door', 'Hardtop 4 Door'],
  Mitsubishi: ['Eclipse Cross', 'Mirage', 'Outlander', 'Outlander PHEV'],
  Nissan: ['Altima', 'Ariya', 'Armada', 'Frontier', 'Kicks', 'Leaf', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Rogue Sport', 'Sentra', 'Titan', 'Titan XD', 'Versa', 'Z'],
  Polestar: ['1', '2', '3'],
  Porsche: ['718 Boxster', '718 Cayman', '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Ram: ['1500', '1500 Classic', '2500', '3500', 'ProMaster', 'ProMaster City'],
  Rivian: ['R1S', 'R1T'],
  'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Spectre', 'Wraith'],
  Subaru: ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'Solterra', 'WRX'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Toyota: ['4Runner', 'bZ4X', 'Camry', 'Camry Hybrid', 'Corolla', 'Corolla Cross', 'Corolla Hybrid', 'Crown', 'GR86', 'GR Corolla', 'GR Supra', 'Grand Highlander', 'Highlander', 'Highlander Hybrid', 'Land Cruiser', 'Mirai', 'Prius', 'Prius Prime', 'RAV4', 'RAV4 Hybrid', 'RAV4 Prime', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Tundra Hybrid', 'Venza'],
  Volkswagen: ['Arteon', 'Atlas', 'Atlas Cross Sport', 'Golf GTI', 'Golf R', 'ID.4', 'ID.Buzz', 'Jetta', 'Jetta GLI', 'Taos', 'Tiguan'],
  Volvo: ['C40 Recharge', 'S60', 'S90', 'V60', 'V90', 'XC40', 'XC40 Recharge', 'XC60', 'XC90'],
  Other: ['Other / Not Listed'],
};

// Sorted makes list for dropdown
export const TRADE_IN_MAKES = Object.keys(TRADE_IN_VEHICLES).sort();

// Get models for a specific make
export const getModelsForMake = (make: string): string[] => {
  return TRADE_IN_VEHICLES[make] || [];
};

export default TRADE_IN_VEHICLES;
