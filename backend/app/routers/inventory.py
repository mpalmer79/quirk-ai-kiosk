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
    cabStyle: Optional[str] = None
    bedLength: Optional[str] = None


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


# =============================================================================
# GM MODEL CODE DECODER
# Format: [Drive Prefix][Series][Body Code]
# Drive: CC = 2WD Chevrolet, CK = 4WD Chevrolet
# Series: 10 = 1500, 20 = 2500HD, 30 = 3500HD
# Body Code: 703 = Reg Cab Std Bed, 903 = Reg Cab Long Bed,
#            753 = Double Cab Std Bed, 953 = Double Cab Long Bed,
#            543 = Crew Cab Short Bed, 743 = Crew Cab Std Bed, 943 = Crew Cab Long Bed
# =============================================================================

BODY_CODE_MAP = {
    '703': {'cab': 'Regular Cab', 'bed': 'Standard Bed'},
    '903': {'cab': 'Regular Cab', 'bed': 'Long Bed'},
    '753': {'cab': 'Double Cab', 'bed': 'Standard Bed'},
    '953': {'cab': 'Double Cab', 'bed': 'Long Bed'},
    '543': {'cab': 'Crew Cab', 'bed': 'Short Bed'},
    '743': {'cab': 'Crew Cab', 'bed': 'Standard Bed'},
    '943': {'cab': 'Crew Cab', 'bed': 'Long Bed'},
    # Colorado specific codes
    '410': {'cab': 'Extended Cab', 'bed': 'Standard Bed'},
    '442': {'cab': 'Crew Cab', 'bed': 'Short Bed'},
    '443': {'cab': 'Crew Cab', 'bed': 'Standard Bed'},
}


def parse_model_code(model_str: str) -> dict:
    """
    Parse GM model code to extract cab style and bed length.
    Example: "SILVERADO 1500 CK10703" -> {'cab': 'Regular Cab', 'bed': 'Standard Bed', 'drive': '4WD'}
    """
    result = {'cab': None, 'bed': None, 'drive': None}
    
    if not model_str:
        return result
    
    model_upper = model_str.upper()
    
    # Look for model codes like CK10703, CC20943, etc.
    import re
    
    # Pattern for Silverado/Sierra codes: CC/CK + 10/20/30 + 3-digit body code
    pattern = r'(CC|CK)([123]0)(\d{3})'
    match = re.search(pattern, model_upper)
    
    if match:
        drive_code = match.group(1)
        series = match.group(2)
        body_code = match.group(3)
        
        result['drive'] = '4WD' if drive_code == 'CK' else '2WD'
        
        if body_code in BODY_CODE_MAP:
            result['cab'] = BODY_CODE_MAP[body_code]['cab']
            result['bed'] = BODY_CODE_MAP[body_code]['bed']
        
        return result
    
    # Pattern for Colorado codes: CC/CK + 204 + 2-digit body code
    pattern_colorado = r'(CC|CK)(204)(\d{2})'
    match_colorado = re.search(pattern_colorado, model_upper)
    
    if match_colorado:
        drive_code = match_colorado.group(1)
        body_code = match_colorado.group(2) + match_colorado.group(3)[-2:]
        
        result['drive'] = '4WD' if drive_code == 'CK' else '2WD'
        
        # Colorado body codes
        if '42' in body_code or '43' in body_code:
            result['cab'] = 'Crew Cab'
            result['bed'] = 'Standard Bed'
        elif '10' in body_code:
            result['cab'] = 'Extended Cab'
            result['bed'] = 'Standard Bed'
        
        return result
    
    return result


# =============================================================================
# COLOR NORMALIZATION
# =============================================================================

COLOR_MAP = {
    # Whites
    'summit white': 'white',
    'iridescent pearl tricoat': 'white',
    'iridescent pearl': 'white',
    'polar white': 'white',
    'arctic white': 'white',
    'pearl white': 'white',
    'white frost': 'white',
    'summit white tricoat': 'white',
    'white': 'white',
    # Blacks
    'black': 'black',
    'mosaic black': 'black',
    'mosaic black metallic': 'black',
    'black metallic': 'black',
    'midnight black': 'black',
    'gloss black': 'black',
    'onyx black': 'black',
    # Silvers/Grays
    'silver ice metallic': 'silver',
    'sterling gray': 'silver',
    'satin steel metallic': 'gray',
    'satin steel': 'gray',
    'shadow gray metallic': 'gray',
    'shadow gray': 'gray',
    'graphite gray': 'gray',
    'graphite metallic': 'gray',
    'smoke gray': 'gray',
    'sterling silver': 'silver',
    'quicksilver metallic': 'silver',
    'silver sage metallic': 'silver',
    # Reds
    'radiant red': 'red',
    'radiant red tintcoat': 'red',
    'cherry red': 'red',
    'cherry red tintcoat': 'red',
    'cajun red': 'red',
    'cajun red tintcoat': 'red',
    'red hot': 'red',
    'glory red': 'red',
    'torch red': 'red',
    'rapid red': 'red',
    'crimson red': 'red',
    # Blues
    'kinetic blue': 'blue',
    'kinetic blue metallic': 'blue',
    'northsky blue': 'blue',
    'northsky blue metallic': 'blue',
    'glacier blue': 'blue',
    'glacier blue metallic': 'blue',
    'pacific blue': 'blue',
    'pacific blue metallic': 'blue',
    'riverside blue': 'blue',
    'riverside blue metallic': 'blue',
    'bright blue': 'blue',
    'midnight blue': 'blue',
    'midnight blue metallic': 'blue',
    'riptide blue': 'blue',
    'riptide blue metallic': 'blue',
    # Greens
    'evergreen gray': 'green',
    'evergreen gray metallic': 'green',
    'woodland green': 'green',
    'heritage green': 'green',
    'cypress gray': 'green',
    'cypress green': 'green',
    # Browns/Tans
    'harvest bronze': 'brown',
    'harvest bronze metallic': 'brown',
    'auburn metallic': 'brown',
    'sand dune': 'tan',
    'sand dune metallic': 'tan',
    # Oranges
    'orange burst': 'orange',
    'orange burst metallic': 'orange',
    'sebring orange': 'orange',
    'sebring orange tintcoat': 'orange',
    'crush orange': 'orange',
    # Yellows
    'accelerate yellow': 'yellow',
    'accelerate yellow metallic': 'yellow',
    'nitro yellow': 'yellow',
    'nitro yellow metallic': 'yellow',
    'bright yellow': 'yellow',
}


def normalize_color(exterior_color: str) -> str:
    """Normalize PBS color name to base color"""
    if not exterior_color:
        return 'white'
    
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


# =============================================================================
# VEHICLE IMAGE MAPPING BY MODEL, CAB STYLE, AND COLOR
# =============================================================================

# Silverado 1500 images by cab style and color
SILVERADO_1500_IMAGES = {
    'regular_cab': {
        'white': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b0.png',
        'black': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b1.png',
        'red': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b2.png',
        'gray': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b3.png',
        'blue': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b4.png',
        'silver': 'https://vehicle-images.dealerinspire.com/stock-images/chrome/cc5fc4a7c3b0d5e8b8c7a7d9e7f8a9b5.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
    },
    'double_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-glt-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
    },
    'crew_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-glt-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
    },
    'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png',
}

# Silverado HD (2500/3500) images by cab style and color
SILVERADO_HD_IMAGES = {
    'regular_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-glt-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
    },
    'double_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-glt-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
    },
    'crew_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-glt-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
    },
    'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-hd/colorizer/jellybean/01-images/2024-silverado-hd-gaz-702x398.png',
}

# Colorado images by cab style and color
COLORADO_IMAGES = {
    'extended_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-glt-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gaz-702x398.png',
    },
    'crew_cab': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-g7c-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-g9k-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-glt-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gaz-702x398.png',
    },
    'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/colorado/colorizer/jellybean/01-images/2024-colorado-gaz-702x398.png',
}

# Non-truck vehicle images by model and color
VEHICLE_IMAGES = {
    'corvette': {
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-g8e-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-gba-702x398.png',
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-gaz-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-gkz-702x398.png',
        'yellow': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-g9d-702x398.png',
        'orange': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-gcm-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-g9k-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/corvette-stingray/colorizer/jellybean/01-images/2024-corvette-stingray-g8e-702x398.png',
    },
    'tahoe': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/tahoe/colorizer/jellybean/01-images/2024-tahoe-gba-702x398.png',
    },
    'suburban': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/suvs/suburban/colorizer/jellybean/01-images/2024-suburban-gaz-702x398.png',
    },
    'traverse': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/traverse/colorizer/jellybean/01-images/2024-traverse-gan-702x398.png',
    },
    'equinox': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/equinox/colorizer/jellybean/01-images/2024-equinox-glt-702x398.png',
    },
    'trailblazer': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-g9k-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trailblazer/colorizer/jellybean/01-images/2024-trailblazer-g7c-702x398.png',
    },
    'trax': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-g9k-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/trax/colorizer/jellybean/01-images/2024-trax-glt-702x398.png',
    },
    'blazer': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-g9k-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/crossovers/blazer-ev/colorizer/jellybean/01-images/2024-blazer-ev-gba-702x398.png',
    },
    'malibu': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-g9k-702x398.png',
        'silver': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-gan-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/cars/malibu/colorizer/jellybean/01-images/2024-malibu-gan-702x398.png',
    },
    'camaro': {
        'yellow': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-g9d-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-g7c-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-gba-702x398.png',
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-gaz-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-glt-702x398.png',
        'orange': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-gcm-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/sports-cars/camaro/colorizer/jellybean/01-images/2024-camaro-g9d-702x398.png',
    },
    'bolt': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-gaz-702x398.png',
        'black': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-gba-702x398.png',
        'red': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-g7c-702x398.png',
        'blue': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-glt-702x398.png',
        'gray': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-g9k-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/electric/bolt-euv/colorizer/jellybean/01-images/2024-bolt-euv-g9k-702x398.png',
    },
    'express': {
        'white': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/vans/express/01-images/2024-express-702x398.png',
        'default': 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/vans/express/01-images/2024-express-702x398.png',
    },
}

# Default fallback image
DEFAULT_IMAGE = 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2024/trucks/silverado-1500/colorizer/jellybean/01-images/2024-silverado-1500-gaz-702x398.png'


def get_image_url(model: str, exterior_color: str = '', cab_style: str = None) -> str:
    """
    Get stock image URL based on model, color, and cab style.
    Uses GM model codes to determine cab configuration for trucks.
    """
    model_lower = model.lower()
    normalized_color = normalize_color(exterior_color)
    
    # Normalize cab style for lookup
    cab_key = None
    if cab_style:
        cab_lower = cab_style.lower()
        if 'regular' in cab_lower:
            cab_key = 'regular_cab'
        elif 'double' in cab_lower:
            cab_key = 'double_cab'
        elif 'extended' in cab_lower:
            cab_key = 'extended_cab'
        elif 'crew' in cab_lower:
            cab_key = 'crew_cab'
    
    # Handle Silverado trucks with cab style awareness
    if 'silverado' in model_lower:
        if '2500' in model_lower or '3500' in model_lower:
            # Silverado HD
            image_set = SILVERADO_HD_IMAGES
        else:
            # Silverado 1500
            image_set = SILVERADO_1500_IMAGES
        
        # Get cab-specific images or default
        if cab_key and cab_key in image_set:
            cab_images = image_set[cab_key]
            return cab_images.get(normalized_color, cab_images.get('default', image_set['default']))
        else:
            # Default to crew cab images
            crew_images = image_set.get('crew_cab', {})
            return crew_images.get(normalized_color, crew_images.get('default', image_set['default']))
    
    # Handle Colorado trucks with cab style awareness
    if 'colorado' in model_lower:
        if cab_key and cab_key in COLORADO_IMAGES:
            cab_images = COLORADO_IMAGES[cab_key]
            return cab_images.get(normalized_color, cab_images.get('default', COLORADO_IMAGES['default']))
        else:
            crew_images = COLORADO_IMAGES.get('crew_cab', {})
            return crew_images.get(normalized_color, crew_images.get('default', COLORADO_IMAGES['default']))
    
    # Handle non-truck vehicles
    for model_key, images in VEHICLE_IMAGES.items():
        if model_key in model_lower:
            return images.get(normalized_color, images.get('default', DEFAULT_IMAGE))
    
    return DEFAULT_IMAGE


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

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
    
    # Check for drive codes in model string
    if 'CK' in model_upper or '4WD' in model_upper or '4X4' in model_upper:
        return '4WD'
    if 'CC' in model_upper and '2WD' not in model_upper:
        # CC prefix indicates 2WD for Chevrolet trucks
        pass  # Continue to check body field
    
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
    
    if 'ZR2' in trim_upper:
        features.extend(['ZR2 Off-Road Package', 'Multimatic DSSV Dampers'])
    
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


def get_body_style(body_type: str, model: str, cab_style: str = None) -> str:
    """Determine body style from PBS data and model info"""
    model_upper = model.upper()
    
    # Trucks
    if 'SILVERADO' in model_upper or 'COLORADO' in model_upper:
        return 'Truck'
    
    # Check body type mapping
    if body_type and body_type.strip() in BODY_TYPE_MAP:
        return BODY_TYPE_MAP[body_type.strip()]
    
    # Model-based defaults
    if any(x in model_upper for x in ['TAHOE', 'SUBURBAN', 'TRAVERSE', 'EQUINOX', 'TRAILBLAZER', 'TRAX', 'BLAZER']):
        return 'SUV'
    if 'CORVETTE' in model_upper or 'CAMARO' in model_upper:
        return 'Coupe'
    if 'MALIBU' in model_upper:
        return 'Sedan'
    if 'EXPRESS' in model_upper:
        return 'Van'
    if 'BOLT' in model_upper:
        return 'Electric'
    
    return 'SUV'


# =============================================================================
# INVENTORY LOADING
# =============================================================================

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
            
            # Parse GM model code for cab/bed info
            model_info = parse_model_code(model)
            cab_style = model_info.get('cab')
            bed_length = model_info.get('bed')
            
            # If model code didn't provide drive info, parse from body
            drivetrain = model_info.get('drive') or parse_drivetrain(body, model)
            
            fuel_type = get_fuel_type(model)
            mpg_city, mpg_highway, ev_range = get_mpg(model)
            
            vehicle = {
                'id': f"v{str(row.get('Stock Number', idx)).strip()}",
                'vin': str(row.get('VIN', '')).strip(),
                'year': int(row.get('Year', 2024)),
                'make': str(row.get('Make', 'Chevrolet')).strip().title(),
                'model': model.strip().title(),
                'trim': trim.strip(),
                'bodyStyle': get_body_style(body_type, model, cab_style),
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
                'imageUrl': get_image_url(model, exterior_color, cab_style),
                'status': CATEGORY_MAP.get(str(row.get('Category', '')).strip(), 'In Stock'),
                'stockNumber': str(row.get('Stock Number', '')).strip(),
                'cabStyle': cab_style,
                'bedLength': bed_length,
            }
            
            vehicles.append(vehicle)
            
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            continue
    
    return vehicles


# Load inventory on module import
INVENTORY = load_inventory_from_excel()
print(f"Loaded {len(INVENTORY)} vehicles from PBS inventory")


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.get("", response_model=InventoryResponse)
async def get_inventory(
    body_style: Optional[str] = Query(None, description="Filter by body style"),
    make: Optional[str] = Query(None, description="Filter by make"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    cab_style: Optional[str] = Query(None, description="Filter by cab style"),
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
    if cab_style:
        vehicles = [v for v in vehicles if v.get("cabStyle") and cab_style.lower() in v["cabStyle"].lower()]
    
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
        or (v.get("cabStyle") and query in v["cabStyle"].lower())
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
    by_cab = {}
    
    for v in INVENTORY:
        by_body[v["bodyStyle"]] = by_body.get(v["bodyStyle"], 0) + 1
        by_status[v["status"]] = by_status.get(v["status"], 0) + 1
        if v.get("cabStyle"):
            by_cab[v["cabStyle"]] = by_cab.get(v["cabStyle"], 0) + 1
    
    prices = [v["price"] for v in INVENTORY]
    
    return {
        "total": len(INVENTORY),
        "byBodyStyle": by_body,
        "byStatus": by_status,
        "byCabStyle": by_cab,
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
