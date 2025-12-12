"""
Trade-In Routes
Handles VIN decoding and trade-in valuation endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# NHTSA VIN Decode API
NHTSA_API_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin"


class VINDecodeResponse(BaseModel):
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    trim: Optional[str] = None
    bodyClass: Optional[str] = None
    driveType: Optional[str] = None
    fuelType: Optional[str] = None
    engineCylinders: Optional[int] = None
    displacementL: Optional[float] = None
    transmissionStyle: Optional[str] = None
    doors: Optional[int] = None
    errorCode: Optional[str] = None
    errorMessage: Optional[str] = None


def extract_nhtsa_value(results: list, variable_name: str) -> Optional[str]:
    """Extract a specific variable from NHTSA results"""
    for item in results:
        if item.get("Variable") == variable_name:
            value = item.get("Value")
            if value and value.strip() and value.strip().lower() != "not applicable":
                return value.strip()
    return None


@router.get("/decode/{vin}", response_model=VINDecodeResponse)
async def decode_vin(vin: str):
    """
    Decode a VIN using the NHTSA Vehicle Identification Number (VIN) Decoder API.
    
    The NHTSA API is free and returns detailed vehicle information including:
    - Year, Make, Model, Trim
    - Body class, Drive type, Fuel type
    - Engine details, Transmission
    
    Args:
        vin: 17-character Vehicle Identification Number
        
    Returns:
        VINDecodeResponse with decoded vehicle information
    """
    # Validate VIN format
    vin = vin.upper().strip()
    
    if len(vin) != 17:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_VIN",
                "message": f"VIN must be exactly 17 characters. Received {len(vin)} characters."
            }
        )
    
    # Check for invalid characters (VINs cannot contain I, O, or Q)
    invalid_chars = set(vin) & set("IOQ")
    if invalid_chars:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_VIN_CHARACTERS",
                "message": f"VIN contains invalid characters: {', '.join(invalid_chars)}. VINs cannot contain I, O, or Q."
            }
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NHTSA_API_URL}/{vin}",
                params={"format": "json"}
            )
            
            if response.status_code != 200:
                logger.error(f"NHTSA API returned status {response.status_code}")
                raise HTTPException(
                    status_code=502,
                    detail={
                        "error": "VIN_DECODE_FAILED",
                        "message": "Unable to decode VIN. Please try again."
                    }
                )
            
            data = response.json()
            results = data.get("Results", [])
            
            if not results:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "VIN_NOT_FOUND",
                        "message": "No vehicle information found for this VIN."
                    }
                )
            
            # Check for error code from NHTSA
            error_code = extract_nhtsa_value(results, "Error Code")
            if error_code and error_code not in ["0", "1"]:  # 0 = success, 1 = minor warning
                error_text = extract_nhtsa_value(results, "Error Text") or "VIN decode failed"
                logger.warning(f"VIN decode warning: {error_code} - {error_text}")
            
            # Extract year and convert to int
            year_str = extract_nhtsa_value(results, "Model Year")
            year = int(year_str) if year_str and year_str.isdigit() else None
            
            # Extract engine cylinders
            cylinders_str = extract_nhtsa_value(results, "Engine Number of Cylinders")
            cylinders = int(cylinders_str) if cylinders_str and cylinders_str.isdigit() else None
            
            # Extract displacement
            displacement_str = extract_nhtsa_value(results, "Displacement (L)")
            displacement = None
            if displacement_str:
                try:
                    displacement = float(displacement_str)
                except ValueError:
                    pass
            
            # Extract doors
            doors_str = extract_nhtsa_value(results, "Doors")
            doors = int(doors_str) if doors_str and doors_str.isdigit() else None
            
            return VINDecodeResponse(
                year=year,
                make=extract_nhtsa_value(results, "Make"),
                model=extract_nhtsa_value(results, "Model"),
                trim=extract_nhtsa_value(results, "Trim"),
                bodyClass=extract_nhtsa_value(results, "Body Class"),
                driveType=extract_nhtsa_value(results, "Drive Type"),
                fuelType=extract_nhtsa_value(results, "Fuel Type - Primary"),
                engineCylinders=cylinders,
                displacementL=displacement,
                transmissionStyle=extract_nhtsa_value(results, "Transmission Style"),
                doors=doors,
                errorCode=error_code,
                errorMessage=extract_nhtsa_value(results, "Error Text") if error_code and error_code not in ["0"] else None
            )
            
    except httpx.TimeoutException:
        logger.error("NHTSA API timeout")
        raise HTTPException(
            status_code=504,
            detail={
                "error": "VIN_DECODE_TIMEOUT",
                "message": "VIN decode service is slow. Please try again."
            }
        )
    except httpx.RequestError as e:
        logger.error(f"NHTSA API request error: {e}")
        raise HTTPException(
            status_code=502,
            detail={
                "error": "VIN_DECODE_ERROR",
                "message": "Unable to reach VIN decode service. Please try again."
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error decoding VIN: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again."
            }
        )
