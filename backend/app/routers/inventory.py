"""
Inventory Router - Handles vehicle inventory endpoints
Reads from PBS DMS Excel export
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import pandas as pd
import os

router = APIRouter()


# Pydantic models for response schema
class Vehicle(BaseModel):
    id: str
    vin: str
    year: int
    make: str
    model: str
    trim: str
    bodyStyle: str
    exteriorColor: str
    interiorColor: str
    mileage: int
    price: float
    msrp: Optional[float] = None
    engine: str
    transmission: str
    drivetrain: str
    fuelType: str
    mpgCity: Optional[int] = None
    mpgHighway: Optional[int] = None
    evRange: Optional[int] = None
    features: List[str]
    imageUrl: str
    status: str
    stockNumber: str


class InventoryResponse(BaseModel):
    vehicles: List[Vehicle]
    total: int
    featured: Optional[List[Vehicle]] = None


# Body type mapping from PBS codes
BODY_TYPE_MAP = {
    'PKUP': 'Truck',
    'FLTBD': 'Truck',
    'VAN': 'Van',
    'COUPE': 'Coupe',
    'CONVT': 'Convertible',
    'APURP': 'SUV',
}

# Category mapping
CATEGORY_MAP = {
    'ON DEALER LOT': 'In Stock',
    'ON DEALER LOT ': 'In Stock',
    'IN TRANSIT': 'In Transit',
    'IN TRANSIT SOLD': 'Sold - In Transit',
}

# Color normalization mapping
COLOR_MAP = {
    # Whites
    'summit white': 'white',
    'iridescent pearl tricoat': 'white',
    'polar white': 'white',
    'arctic white': 'white',
    'pearl white': 'white',
    'white frost': 'white',
    'summit white tricoat': 'white',
    # Blacks
    'black': 'black',
    'mosaic black': 'black',
    'black metallic': 'black',
    'midnight black': 'black',
    'gloss black': 'black',
    # Silvers/Grays
    'silver ice metallic': 'silver',
    'sterling gray': 'silver',
    'satin steel metallic': 'silver',
    'shadow gray metallic': 'gray',
    'graphite gray': 'gray',
    'smoke gray': 'gray',
    'sterling silver': 'silver',
    # Reds
    'radiant red': 'red',
    'cherry red': 'red',
    'cajun red': 'red',
    'red hot': 'red',
    'glory red': 'red',
    'torch red': 'red',
    'rapid red': 'red',
    # Blues
    'kinetic blue': 'blue',
    'northsky blue': 'blue',
    'glacier blue': 'blue',
    'pacific blue': 'blue',
    'riverside blue': 'blue',
    'bright blue': 'blue',
    'midnight blue': 'blue',
    # Greens
    'evergreen gray': 'green',
    'woodland green': 'green',
    'heritage green': 'green',
    # Browns/Tans
    'harvest bronze': 'brown',
    'auburn metallic': 'brown',
    'sand dune': 'tan',
    # Oranges
    'orange burst': 'orange',
    'sebring orange': 'orange',
    'crush orange': 'orange',
    # Yellows
    'accelerate yellow': 'yellow',
    'nitro yellow': 'yellow',
    'bright yellow': 'yellow',
}


def normalize_color(exterior_color: str) -> str:
    """Normalize PBS color name to base color"""
    color_lower = exterior_color.lower().strip()
    
    # Check direct mapping
    if color_lower in COLOR_MAP:
        return COLOR_MAP[color_lower]
    
    # Check if base color is in the name
    base_colors = ['white', 'black', 'silver', 'gray', 'grey', 'red', 'blue', 'green', 'brown', 'orange', 'yellow', 'tan', 'gold']
    for base in base_colors:
        if base in color_lower:
            if base == 'grey':
                return 'gray'
            return base
    
    # Default to white
    return 'white'


# Chevrolet stock images organized by model and color
VEHICLE_IMAGES = {
    'corvette': {
        'red': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-red-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-black-1.jpg',
        'white': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-white-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-blue-1.jpg',
        'yellow': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-yellow-1.jpg',
        'orange': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-orange-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/07/2024-Chevrolet-Corvette-Stingray-coupe-red-1.jpg',
    },
    'silverado 1500': {
        'white': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2022/12/2024-Chevrolet-Silverado-1500-white-1.jpg',
    },
    'silverado 2500': {
        'white': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-red-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-white-1.jpg',
    },
    'silverado 3500': {
        'white': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-red-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/01/2024-Chevrolet-Silverado-HD-white-1.jpg',
    },
    'tahoe': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-black-1.jpg',
    },
    'suburban': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Suburban-white-1.jpg',
    },
    'traverse': {
        'white': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/08/2024-Chevrolet-Traverse-silver-1.jpg',
    },
    'equinox': {
        'white': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Equinox-blue-1.jpg',
    },
    'colorado': {
        'white': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/02/2024-Chevrolet-Colorado-blue-1.jpg',
    },
    'trailblazer': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trailblazer-red-1.jpg',
    },
    'trax': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Trax-blue-1.jpg',
    },
    'blazer': {
        'white': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/03/2024-Chevrolet-Blazer-black-1.jpg',
    },
    'malibu': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-gray-1.jpg',
        'silver': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-silver-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Malibu-silver-1.jpg',
    },
    'camaro': {
        'yellow': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-yellow-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-red-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-black-1.jpg',
        'white': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-white-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-blue-1.jpg',
        'orange': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-orange-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2022/04/2024-Chevrolet-Camaro-yellow-1.jpg',
    },
    'bolt': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-white-1.jpg',
        'black': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-black-1.jpg',
        'red': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-red-1.jpg',
        'blue': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-blue-1.jpg',
        'gray': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-gray-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Bolt-EUV-gray-1.jpg',
    },
    'express': {
        'white': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Express-white-1.jpg',
        'default': 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Express-white-1.jpg',
    },
}

# Default fallback image
DEFAULT_IMAGE = 'https://www.motortrend.com/uploads/2023/06/2024-Chevrolet-Tahoe-black-1.jpg'


def get_image_url(model: str, exterior_color: str = '') -> str:
    """Get stock image URL based on model and color"""
    model_lower = model.lower()
    normalized_color = normalize_color(exterior_color)
    
    # Find matching model
    matched_model = None
    for model_key in VEHICLE_IMAGES.keys():
        if model_key in model_lower:
            matched_model = model_key
            break
    
    # Special handling for Silverado variants
    if 'silverado' in model_lower:
        if '2500' in model_lower or '3500' in model_lower:
            matched_model = 'silverado 2500' if '2500' in model_lower else 'silverado 3500'
        else:
            matched_model = 'silverado 1500'
    
    if matched_model and matched_model in VEHICLE_IMAGES:
        model_images = VEHICLE_IMAGES[matched_model]
        # Return color-matched image or default for that model
        return model_images.get(normalized_color, model_images.get('default', DEFAULT_IMAGE))
    
    return DEFAULT_IMAGE


def get_engine(cylinders, model: str) -> str:
    """Derive engine string from cylinders and model"""
    model_upper = model.upper()
    
    if 'EV' in model_upper or 'ELECTRIC' in model_upper:
        return 'Electric Motor'
    
    if 'CORVETTE' in model_upper:
        if 'E-RAY' in model_upper:
            return '6.2L V8 + Electric Motor'
        return '6.2L V8'
    
    try:
        cyl = int(cylinders)
        if cyl == 8:
            if 'HD' in model_upper or '2500' in model_upper or '3500' in model_upper:
                return '6.6L V8'
            return '6.2L V8'
        elif cyl == 6:
            return '3.6L V6'
        elif cyl == 4:
            return '2.0L Turbo I4'
        elif cyl == 3:
            return '1.2L Turbo I3'
    except (ValueError, TypeError):
        pass
    
    return '2.0L Turbo'


def get_transmission(model: str) -> str:
    """Derive transmission from model"""
    model_upper = model.upper()
    
    if 'EV' in model_upper:
        return 'Single-Speed Direct Drive'
    if 'CORVETTE' in model_upper:
        return '8-Speed Dual Clutch'
    if 'SILVERADO' in model_upper or 'COLORADO' in model_upper:
        return '10-Speed Automatic'
    
    return '9-Speed Automatic'


def parse_drivetrain(body: str, model: str = '') -> str:
    """Parse drivetrain from PBS Body field"""
    model_upper = model.upper() if model else ''
    
    # Corvette special handling
    if 'CORVETTE' in model_upper:
        if 'E-RAY' in model_upper:
            return 'AWD'
        return 'RWD'
    
    if not body or pd.isna(body):
        return 'FWD'
    
    body_upper = str(body).upper()
    if '4WD' in body_upper or '4X4' in body_upper:
        return '4WD'
    if 'AWD' in body_upper:
        return 'AWD'
    if 'RWD' in body_upper:
        return 'RWD'
    
    return 'FWD'


def get_fuel_type(model: str) -> str:
    """Determine fuel type from model"""
    model_upper = model.upper()
    
    if 'EV' in model_upper or 'ELECTRIC' in model_upper:
        return 'Electric'
    if 'E-RAY' in model_upper:
        return 'Hybrid'
    
    return 'Gasoline'


def get_mpg(model: str):
    """Get MPG estimates based on model"""
    model_upper = model.upper()
    
    if 'EV' in model_upper:
        return None, None, 300
    
    if 'SILVERADO' in model_upper or 'COLORADO' in model_upper:
        if '2500' in model_upper or '3500' in model_upper:
            return 15, 19, None
        return 17, 23, None
    
    if 'TAHOE' in model_upper or 'SUBURBAN' in model_upper:
        return 16, 21, None
    if 'TRAVERSE' in model_upper:
        return 20, 27, None
    if 'EQUINOX' in model_upper:
        return 26, 31, None
    if 'TRAILBLAZER' in model_upper:
        return 28, 33, None
    if 'TRAX' in model_upper:
        return 28, 32, None
    if 'CORVETTE' in model_upper:
        return 16, 24, None
    
    return 24, 30, None


def get_features(trim: str, model: str) -> List[str]:
    """Generate feature list based on trim and model"""
    features = ['Apple CarPlay', 'Android Auto', 'Backup Camera']
    
    trim_upper = (trim or '').upper()
    model_upper = model.upper()
    
    if 'LT' in trim_upper or 'RS' in trim_upper:
        features.extend(['Heated Seats', 'Remote Start'])
    
    if 'Z71' in trim_upper:
        features.extend(['Z71 Off-Road Package', 'Skid Plates'])
    
    if 'TRAIL BOSS' in trim_upper:
        features.extend(['Trail Boss Package', 'Lifted Suspension'])
    
    if 'PREMIER' in trim_upper or 'HIGH COUNTRY' in trim_upper:
        features.extend(['Leather Seats', 'Bose Audio', 'Panoramic Sunroof'])
    
    if 'Z06' in trim_upper or 'Z06' in model_upper:
        features.extend(['Z06 Performance Package', 'Carbon Fiber Aero'])
    
    if 'CORVETTE' in model_upper:
        features.extend(['Performance Exhaust', 'Head-Up Display'])
    
    if 'EV' in model_upper:
        features.extend(['One-Pedal Driving', 'DC Fast Charging'])
    
    return list(set(features))


def load_inventory_from_excel() -> List[dict]:
    """Load and transform PBS Excel export to vehicle records"""
    
    possible_paths = [
        os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'inventory.xlsx'),
        '/app/data/inventory.xlsx',
        'data/inventory.xlsx',
        'inventory.xlsx',
    ]
    
    excel_path = None
    for path in possible_paths:
        if os.path.exists(path):
            excel_path = path
            break
    
    if not excel_path:
        print("Warning: No inventory file found, using empty inventory")
        return []
    
    try:
        df = pd.read_excel(excel_path)
        print(f"Reading inventory from {excel_path}")
    except Exception as e:
        print(f"Error reading inventory: {e}")
        return []
    
    vehicles = []
    
    for idx, row in df.iterrows():
        try:
            msrp = float(row.get('MSRP', 0) or 0)
            if msrp <= 0:
                continue
            
            model = str(row.get('Model', ''))
            trim = str(row.get('Trim', ''))
            body = str(row.get('Body', ''))
            body_type = str(row.get('Body Type', ''))
            cylinders = row.get('Cylinders', 0)
            exterior_color = str(row.get('Exterior Color', '')).strip()
            
            drivetrain = parse_drivetrain(body, model)
            fuel_type = get_fuel_type(model)
            mpg_city, mpg_highway, ev_range = get_mpg(model)
            
            vehicle = {
                'id': f"v{str(row.get('Stock Number', idx)).strip()}",
                'vin': str(row.get('VIN', '')).strip(),
                'year': int(row.get('Year', 2024)),
                'make': str(row.get('Make', 'Chevrolet')).strip().title(),
                'model': model.strip().title(),
                'trim': trim.strip(),
                'bodyStyle': BODY_TYPE_MAP.get(body_type.strip(), 'SUV'),
                'exteriorColor': exterior_color.title(),
                'interiorColor': 'Jet Black',
                'mileage': 0,
                'price': round(msrp * 0.97, 2),
                'msrp': msrp,
                'engine': get_engine(cylinders, model),
                'transmission': get_transmission(model),
                'drivetrain': drivetrain,
                'fuelType': fuel_type,
                'mpgCity': mpg_city,
                'mpgHighway': mpg_highway,
                'evRange': ev_range,
                'features': get_features(trim, model),
                'imageUrl': get_image_url(model, exterior_color),
                'status': CATEGORY_MAP.get(str(row.get('Category', '')).strip(), 'In Stock'),
                'stockNumber': str(row.get('Stock Number', '')).strip(),
            }
            
            vehicles.append(vehicle)
            
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            continue
    
    return vehicles


# Load inventory on module import
INVENTORY = load_inventory_from_excel()
print(f"Loaded {len(INVENTORY)} vehicles from PBS inventory")


@router.get("", response_model=InventoryResponse)
async def get_inventory(
    body_style: Optional[str] = Query(None, description="Filter by body style"),
    make: Optional[str] = Query(None, description="Filter by make"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """Get all vehicles in inventory with optional filters"""
    vehicles = INVENTORY.copy()
    
    if body_style:
        vehicles = [v for v in vehicles if v["bodyStyle"].lower() == body_style.lower()]
    if make:
        vehicles = [v for v in vehicles if v["make"].lower() == make.lower()]
    if min_price:
        vehicles = [v for v in vehicles if v["price"] >= min_price]
    if max_price:
        vehicles = [v for v in vehicles if v["price"] <= max_price]
    if fuel_type:
        vehicles = [v for v in vehicles if v["fuelType"].lower() == fuel_type.lower()]
    if status:
        vehicles = [v for v in vehicles if status.lower() in v["status"].lower()]
    
    vehicles.sort(key=lambda x: x["price"], reverse=True)
    
    featured = []
    seen_models = set()
    for v in vehicles:
        if v["model"] not in seen_models and len(featured) < 6:
            featured.append(v)
            seen_models.add(v["model"])
    
    return InventoryResponse(
        vehicles=vehicles,
        total=len(vehicles),
        featured=featured
    )


@router.get("/featured", response_model=List[Vehicle])
async def get_featured_vehicles():
    """Get featured vehicles - variety of top models"""
    featured = []
    seen_models = set()
    sorted_inv = sorted(INVENTORY, key=lambda x: x["price"], reverse=True)
    
    for v in sorted_inv:
        model_key = v["model"].split()[0]
        if model_key not in seen_models and len(featured) < 8:
            featured.append(v)
            seen_models.add(model_key)
    
    return featured


@router.get("/search")
async def search_inventory(q: str = Query(..., min_length=1)):
    """Search inventory"""
    query = q.lower()
    results = [
        v for v in INVENTORY
        if query in v["make"].lower()
        or query in v["model"].lower()
        or query in v["vin"].lower()
        or query in v["stockNumber"].lower()
        or query in v["bodyStyle"].lower()
        or query in v["exteriorColor"].lower()
        or query in v["trim"].lower()
    ]
    return {"vehicles": results, "total": len(results), "query": q}


@router.get("/models")
async def get_available_models():
    """Get available models for filtering"""
    models = {}
    for v in INVENTORY:
        model = v["model"]
        if model not in models:
            models[model] = {"count": 0, "minPrice": v["price"], "maxPrice": v["price"]}
        models[model]["count"] += 1
        models[model]["minPrice"] = min(models[model]["minPrice"], v["price"])
        models[model]["maxPrice"] = max(models[model]["maxPrice"], v["price"])
    
    return {"models": models, "total": len(models)}


@router.get("/stats")
async def get_inventory_stats():
    """Get inventory statistics"""
    if not INVENTORY:
        return {"total": 0}
    
    by_body = {}
    by_status = {}
    
    for v in INVENTORY:
        by_body[v["bodyStyle"]] = by_body.get(v["bodyStyle"], 0) + 1
        by_status[v["status"]] = by_status.get(v["status"], 0) + 1
    
    prices = [v["price"] for v in INVENTORY]
    
    return {
        "total": len(INVENTORY),
        "byBodyStyle": by_body,
        "byStatus": by_status,
        "priceRange": {"min": min(prices), "max": max(prices), "avg": sum(prices) / len(prices)}
    }


@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle_by_id(vehicle_id: str):
    """Get vehicle by ID"""
    vehicle = next((v for v in INVENTORY if v["id"] == vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("/vin/{vin}", response_model=Vehicle)
async def get_vehicle_by_vin(vin: str):
    """Get vehicle by VIN"""
    vehicle = next((v for v in INVENTORY if v["vin"].upper() == vin.upper()), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("/stock/{stock_number}", response_model=Vehicle)
async def get_vehicle_by_stock(stock_number: str):
    """Get vehicle by stock number"""
    vehicle = next((v for v in INVENTORY if v["stockNumber"] == stock_number), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
