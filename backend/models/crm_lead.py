# /backend/app/models/crm_lead.py (A new file for models)

from pydantic import BaseModel
from typing import Optional

class CrmLead(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None # Optional phone number
    
    # Context data captured by the kiosk
    context_vin: Optional[str] = None # The VIN of the car the customer was looking at
    context_page: str = "Kiosk Showroom" # Source of the lead
