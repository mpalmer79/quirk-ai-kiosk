from functools import lru_cache
from pydantic import SecretStr
import logging

logger = logging.getLogger(__name__)

class APIKeyManager:
    """Secure API key management with rotation support"""
    
    def __init__(self):
        self._anthropic_key: SecretStr | None = None
        self._load_keys()
    
    def _load_keys(self):
        import os
        key = os.getenv("ANTHROPIC_API_KEY")
        if key:
            self._anthropic_key = SecretStr(key)
            logger.info("Anthropic API key loaded (masked)")
        else:
            logger.warning("ANTHROPIC_API_KEY not configured")
    
    @property
    def anthropic_key(self) -> str | None:
        return self._anthropic_key.get_secret_value() if self._anthropic_key else None
    
    def rotate_keys(self):
        """Called by admin endpoint or scheduled task"""
        self._load_keys()

@lru_cache()
def get_key_manager() -> APIKeyManager:
    return APIKeyManager()
```

---

### 2. **Security: Rate Limiting**
No rate limiting on any endpoints. A single user could DOS your kiosk or rack up AI API costs.

**Fix** - Add to `backend/requirements.txt`:
```
slowapi==0.1.9
