import os
from urllib.parse import urlparse
from typing import Tuple
from pathlib import Path
from dotenv import load_dotenv

# Load root .env file if present
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_raw_db = os.getenv("DATABASE_PATH", "caresaathi.db")
_resolved_db = str((ROOT_DIR / _raw_db).resolve()) if not Path(_raw_db).is_absolute() else _raw_db

class Settings:
    APP_NAME: str = "CareSaathi AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_PATH: str = _resolved_db
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "caresaathi-dev-insecure-secret-key-32chars-min!!")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OVERPASS_API_URL: str = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
    NOMINATIM_URL: str = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    USER_AGENT: str = os.getenv("USER_AGENT", "CareSaathiAI/1.0 (healthcare-navigation-hackathon)")
    
    @property
    def cors_origins(self) -> list[str]:
        raw_cors = os.getenv("CORS_ORIGINS", "")
        if raw_cors:
            return [o.strip() for o in raw_cors.split(",") if o.strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

    def validate_security_settings(self):
        """Enforces security constraints for production deployment."""
        if self.ENVIRONMENT.lower() == "production":
            if not self.JWT_SECRET or len(self.JWT_SECRET) < 32 or "insecure" in self.JWT_SECRET.lower() or "vnr-hack" in self.JWT_SECRET.lower():
                raise RuntimeError("Production security violation: JWT_SECRET must be set in environment and be at least 32 characters long.")
            if "*" in self.cors_origins:
                raise RuntimeError("Production security violation: CORS_ORIGINS cannot contain wildcard '*' in production.")

settings = Settings()

# Official Government Portal Domain Allowlist & Validation
ALLOWED_OFFICIAL_DOMAINS = [
    # National (PM-JAY, CGHS, ESIC, PMBJP)
    "pmjay.gov.in",
    "beneficiary.nha.gov.in",
    "nha.gov.in",
    "cghs.nic.in",
    "cghs.gov.in",
    "esic.gov.in",
    "janaushadhi.gov.in",

    # Telangana (Aarogyasri)
    "aarogyasri.telangana.gov.in",
    "telangana.gov.in",

    # Maharashtra (MJPJAY)
    "jeevandayee.gov.in",

    # Karnataka (AB-ArK / SAST)
    "arogya.karnataka.gov.in",
    "karnataka.gov.in",

    # Andhra Pradesh (Dr. YSR Aarogyasri)
    "aarogyasri.ap.gov.in",
    "ap.gov.in",

    # Gujarat (Mukhyamantri Amrutum / PMJAY Gujarat)
    "pmjay.gujarat.gov.in",
    "gujarat.gov.in",

    # West Bengal (Swasthya Sathi)
    "swasthyasathi.gov.in",
    "wb.gov.in",

    # Kerala (KASP / SHA)
    "sha.kerala.gov.in",
    "kerala.gov.in",

    # Tamil Nadu (CMCHIS - statutory trust portal)
    "cmchistn.com",
    "www.cmchistn.com",
    "tn.gov.in",

    # Rajasthan (Chiranjeevi / MAAY)
    "chiranjeevi.rajasthan.gov.in",
    "rajasthan.gov.in",

    # Uttar Pradesh (MMJAY / SACHIS)
    "sachis.up.gov.in",
    "up.gov.in",

    # Delhi (DAK / DGHS)
    "dghs.delhi.gov.in",
    "delhi.gov.in",
]

def validate_official_portal_url(url: str) -> Tuple[bool, str]:
    """
    Validates that a URL:
    1. Uses HTTPS protocol.
    2. Host matches an official government or statutory authority domain on the allowlist.
    Returns (is_valid, reason).
    """
    if not url:
        return False, "URL is missing"
    
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() != "https":
            return False, "Rejected: Must use secure HTTPS protocol"
        
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False, "Rejected: Invalid hostname"
        
        for allowed in ALLOWED_OFFICIAL_DOMAINS:
            if hostname == allowed or hostname.endswith("." + allowed):
                return True, "Verified official government domain"
        
        # Also allow any bona fide *.gov.in or *.nic.in subdomain
        if hostname.endswith(".gov.in") or hostname.endswith(".nic.in"):
            return True, "Verified official Indian government domain"

        return False, f"Rejected: Domain '{hostname}' is not in the official government allowlist"
    except Exception as e:
        return False, f"Invalid URL structure: {e}"
