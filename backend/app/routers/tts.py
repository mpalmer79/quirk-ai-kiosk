"""
Text-to-Speech Router - ElevenLabs Integration

Provides realistic TTS using ElevenLabs API with fallback indicator
for browser-based speech synthesis when API key is not configured.

Environment Variables:
    ELEVENLABS_API_KEY: Your ElevenLabs API key (optional)
    ELEVENLABS_VOICE_ID: Voice ID to use (optional, defaults to "Rachel")
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import re

router = APIRouter()

# ElevenLabs Configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel

# Available voices (for reference)
ELEVENLABS_VOICES = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",      # Calm, professional female
    "domi": "AZnzlk1XvdvUeBnXmlld",         # Confident, friendly female
    "bella": "EXAVITQu4vr4xnSDxMaL",        # Warm, engaging female
    "antoni": "ErXwobaYiN019PkySvjV",       # Warm, friendly male
    "elli": "MF3mGyEYCl7XYWbV9V6O",         # Thoughtful, young female
    "josh": "TxGEqnHWrfWFTfGW9XjX",         # Deep, mature male
    "arnold": "VR6AewLTigWG4xSOukaG",       # Authoritative male
    "adam": "pNInz6obpgDQGcFmaJgB",         # Deep, narrative male
    "sam": "yoZ06aMxZJJ28mfd3POQ",          # Energetic, dynamic male
}


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    stability: Optional[float] = 0.5       # 0-1, lower = more expressive
    similarity_boost: Optional[float] = 0.8  # 0-1, higher = more similar to original voice
    style: Optional[float] = 0.5           # 0-1, style exaggeration (v2 voices only)


class TTSStatusResponse(BaseModel):
    available: bool
    provider: str
    voice_id: Optional[str]
    voices: dict


@router.get("/status")
async def get_tts_status() -> TTSStatusResponse:
    """Check if ElevenLabs TTS is configured and available"""
    return TTSStatusResponse(
        available=bool(ELEVENLABS_API_KEY),
        provider="elevenlabs" if ELEVENLABS_API_KEY else "browser",
        voice_id=ELEVENLABS_VOICE_ID if ELEVENLABS_API_KEY else None,
        voices=ELEVENLABS_VOICES if ELEVENLABS_API_KEY else {}
    )


@router.post("/speak")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using ElevenLabs API.
    Returns audio/mpeg stream if successful, or error status for fallback.
    """
    
    if not ELEVENLABS_API_KEY:
        # Return indicator to use browser fallback
        raise HTTPException(
            status_code=503,
            detail={
                "error": "elevenlabs_not_configured",
                "message": "ElevenLabs API key not set. Using browser speech.",
                "fallback": True
            }
        )
    
    # Clean text for TTS
    clean_text = clean_text_for_speech(request.text)
    
    if not clean_text or len(clean_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="No speakable text provided")
    
    # Truncate if too long (ElevenLabs has limits)
    if len(clean_text) > 5000:
        clean_text = clean_text[:5000] + "..."
    
    voice_id = request.voice_id or ELEVENLABS_VOICE_ID
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    payload = {
        "text": clean_text,
        "model_id": "eleven_monolingual_v1",  # or eleven_multilingual_v2
        "voice_settings": {
            "stability": request.stability,
            "similarity_boost": request.similarity_boost,
            "style": request.style,
            "use_speaker_boost": True
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                # Stream the audio back
                return StreamingResponse(
                    iter([response.content]),
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "inline",
                        "Cache-Control": "no-cache"
                    }
                )
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "invalid_api_key",
                        "message": "ElevenLabs API key is invalid",
                        "fallback": True
                    }
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "rate_limited",
                        "message": "ElevenLabs rate limit exceeded",
                        "fallback": True
                    }
                )
            else:
                print(f"ElevenLabs error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "elevenlabs_error",
                        "message": f"ElevenLabs API error: {response.status_code}",
                        "fallback": True
                    }
                )
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "timeout",
                "message": "ElevenLabs request timed out",
                "fallback": True
            }
        )
    except httpx.RequestError as e:
        print(f"ElevenLabs request error: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "request_error",
                "message": "Failed to connect to ElevenLabs",
                "fallback": True
            }
        )


@router.get("/voices")
async def list_voices():
    """List available ElevenLabs voices"""
    
    if not ELEVENLABS_API_KEY:
        return {
            "available": False,
            "voices": [],
            "presets": ELEVENLABS_VOICES
        }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": ELEVENLABS_API_KEY}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "available": True,
                    "voices": [
                        {
                            "voice_id": v["voice_id"],
                            "name": v["name"],
                            "category": v.get("category", "unknown"),
                            "preview_url": v.get("preview_url")
                        }
                        for v in data.get("voices", [])
                    ],
                    "presets": ELEVENLABS_VOICES
                }
            else:
                return {
                    "available": False,
                    "voices": [],
                    "presets": ELEVENLABS_VOICES,
                    "error": f"API error: {response.status_code}"
                }
                
    except Exception as e:
        return {
            "available": False,
            "voices": [],
            "presets": ELEVENLABS_VOICES,
            "error": str(e)
        }


def clean_text_for_speech(text: str) -> str:
    """Clean text for natural TTS output"""
    
    # Remove emojis
    text = re.sub(r'[\U0001F600-\U0001F6FF\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U0001F900-\U0001F9FF]', '', text)
    
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)       # Italic
    text = re.sub(r'__(.+?)__', r'\1', text)       # Bold
    text = re.sub(r'_(.+?)_', r'\1', text)         # Italic
    text = re.sub(r'~~(.+?)~~', r'\1', text)       # Strikethrough
    text = re.sub(r'`(.+?)`', r'\1', text)         # Code
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)  # Headers
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # Bullets
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # Numbered lists
    
    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    
    # Convert common abbreviations for better pronunciation
    replacements = {
        'MPG': 'miles per gallon',
        'HP': 'horsepower',
        'lb-ft': 'pound-feet',
        'AWD': 'all wheel drive',
        '4WD': 'four wheel drive',
        'FWD': 'front wheel drive',
        'RWD': 'rear wheel drive',
        'EV': 'electric vehicle',
        'SUV': 'S U V',
        'MSRP': 'M S R P',
        'APR': 'A P R',
        'VIN': 'V I N',
    }
    
    for abbr, expanded in replacements.items():
        text = re.sub(rf'\b{abbr}\b', expanded, text, flags=re.IGNORECASE)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text
