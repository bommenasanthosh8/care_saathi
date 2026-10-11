import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
from google.genai import errors
from ..config import settings

logger = logging.getLogger("caresaathi.vision")

VISION_PROMPT = """You are an expert clinical pharmacologist and prescription OCR specialist for the Indian healthcare system.
Analyze this medical prescription image and extract all visible transcribed text, prescribed medications, clinical diagnoses, advised procedures, doctor details, and date.

You MUST output STRICT JSON only, conforming exactly to this schema:
{
  "extracted_text": "Complete transcribed clinical text as visible on the prescription paper line by line",
  "diagnoses_and_procedures": [
    "Clinical diagnosis, recommended surgery, planned procedure, or diagnostic investigation mentioned e.g. 'Total Knee Replacement (TKR)', 'Cataract', 'Appendectomy', 'Cholelithiasis', 'MRI Knee', 'CBC'"
  ],
  "medicines": [
    {
      "name_as_written": "Exact medicine name text as written on the prescription paper",
      "brand_name": "Commercial brand name or null if generic only or illegible",
      "generic_name": "Active pharmacological chemical / salt name or null if unknown or illegible",
      "strength": "Dose strength e.g. '650 mg', '40 mg', '500 mcg', or null if not legible",
      "form": "Dosage form e.g. 'tablet', 'capsule', 'syrup', 'injection', 'eye drops', or null if not legible",
      "dosage_pattern": "Dosage frequency e.g. '1-0-1', 'BD', 'TDS', 'OD', 'SOS', 'HS', or null if not legible",
      "duration_days": 5, // Integer number of days course, or null if not legible
      "quantity": 10,     // Total unit quantity calculated from dosage x duration, or null if unknown
      "confidence": 0.95  // Float 0.0 to 1.0 indicating legibility confidence
    }
  ],
  "doctor_name": "Doctor name or clinic name, or null if not legible",
  "date": "Prescription date or null if not legible",
  "unreadable_parts": ["List of any illegible words, doubtful lines, or unclear handwriting sections"]
}

STRICT CLINICAL RULES:
1. ONLY extract information that is ACTUALLY LEGIBLE on the prescription. NEVER invent, hallucinate, or guess diagnoses, operations, medicines, or patient details.
2. Distinctly separate medicines from clinical diagnoses, surgical procedures, and lab investigations.
3. If handwriting is illegible, doubtful, or ambiguous, return null or 'unknown' for unclear fields, set confidence low (< 0.6), and add the doubtful phrase to 'unreadable_parts'.
4. Calculate medicine quantity accurately only when pattern and duration are clearly legible (e.g. BD x 5 days = 10). If duration or frequency is unknown or unreadable, set quantity to null.
5. Output raw valid JSON only. Do NOT include markdown code blocks.
"""

def clean_json_text(text: str) -> str:
    """Strips markdown code fences and cleans text for JSON parsing."""
    t = text.strip()
    if t.startswith("```json"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()

def extract_medicines_with_gemini(
    jpeg_bytes: bytes,
    model_name: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Sends preprocessed JPEG image bytes to Gemini Multimodal Vision using
    the official google-genai SDK.
    Uses settings.GEMINI_API_KEY from root .env. Never exposes or logs the key.
    Model defaults to settings.GEMINI_MODEL (configurable via GEMINI_MODEL env var).
    Returns parsed clinical JSON dictionary or None on failure/fallback.
    """
    if not jpeg_bytes or len(jpeg_bytes) == 0:
        logger.warning("Empty image bytes received for Gemini prescription extraction.")
        return None

    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    if not api_key.strip():
        logger.info("No GEMINI_API_KEY configured on server; using offline prescription OCR fallback.")
        return None

    target_model = model_name or getattr(settings, "GEMINI_MODEL", None) or os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash"

    # Models to attempt in order if target model is unavailable or encounters error
    models_to_try = [target_model]
    if target_model != "gemini-1.5-flash" and "gemini-1.5-flash" not in models_to_try:
        models_to_try.append("gemini-1.5-flash")

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize google-genai Client: {e}")
        return None

    image_part = types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg")
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.1
    )

    for model in models_to_try:
        try:
            logger.info(f"Extracting prescription medications with Gemini model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=[image_part, VISION_PROMPT],
                config=config
            )

            raw_text = response.text or ""
            cleaned = clean_json_text(raw_text)
            parsed = None
            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                # Regex fallback for embedded JSON
                json_match = re.search(r'\{[\s\S]*\}', cleaned)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group(0))
                    except Exception:
                        parsed = None

            if isinstance(parsed, dict) and "medicines" in parsed:
                # Sanitize and post-process medicines list
                sanitized_meds = []
                for med in parsed.get("medicines", []):
                    if not isinstance(med, dict):
                        continue
                    name_written = (med.get("name_as_written") or med.get("brand_name") or "").strip()
                    # Skip completely blank or generic junk labels
                    if not name_written or name_written.lower() in ("unknown", "null", "none", "illegible", "unclear"):
                        continue
                    sanitized_meds.append(med)

                parsed["medicines"] = sanitized_meds
                return parsed

        except errors.APIError as e:
            # Handle quota exhaustion / 429
            if e.code == 429 or "RESOURCE_EXHAUSTED" in str(e).upper() or "QUOTA" in str(e).upper():
                logger.warning(f"Gemini API rate limit or quota exceeded ({e.code}). Gracefully falling back to local OCR pipeline.")
                break  # Quota applies across models for this key, fall back to offline OCR
            elif e.code == 404 or "NOT_FOUND" in str(e).upper():
                logger.warning(f"Gemini model '{model}' not found or unsupported ({e.code}). Trying fallback model...")
                continue
            else:
                logger.warning(f"Gemini API call failed for model '{model}' with code {e.code}. Falling back gracefully.")
        except Exception as e:
            logger.error(f"Unexpected error while calling Gemini Vision ({model}): {e}")

    return None
