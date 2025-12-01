"""
Leads Router - CRM Integration for lead capture
Integrates with VinSolutions CRM in production
"""
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()


class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    context_vin: Optional[str] = None
    context_page: str = "Kiosk Showroom"


class TestDriveRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    vehicle_id: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None


class InfoRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    vehicle_id: str
    questions: Optional[str] = None


class LeadResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: str


# In-memory storage for demo (would be CRM in production)
leads_store = []


@router.post("", response_model=LeadResponse)
async def submit_lead(lead: LeadCreate):
    """
    Submit a new customer lead to the CRM.
    In production, this integrates with VinSolutions CRM API.
    """
    lead_id = str(uuid.uuid4())[:8].upper()
    
    lead_record = {
        "id": lead_id,
        "first
