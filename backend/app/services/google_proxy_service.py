"""
backend/app/services/google_proxy_service.py

Server-side proxy for Google Places API (New), Routes API (computeRouteMatrix),
and Geocoding API with:
- Strict key containment (GOOGLE_MAPS_SERVER_KEY never reaches client)
- In-memory TTL caching
- Input validation & 25-destination batch capping
- Rate limiting protection
- Graceful offline fallback calculation (Haversine road approximations)
"""

import os
import time
import math
import re
import urllib.request
import urllib.parse
import json
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, Response

# In-memory TTL cache: { cache_key: (data, expiry_timestamp) }
_CACHE: Dict[str, tuple[Any, float]] = {}

# Simple sliding window request count for basic rate limiting
_REQUEST_TIMESTAMPS: List[float] = []
MAX_REQUESTS_PER_MINUTE = 120

def _check_rate_limit():
    global _REQUEST_TIMESTAMPS
    now = time.time()
    _REQUEST_TIMESTAMPS = [t for t in _REQUEST_TIMESTAMPS if now - t < 60.0]
    if len(_REQUEST_TIMESTAMPS) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Server proxy rate limit exceeded. Please wait a moment.")
    _REQUEST_TIMESTAMPS.append(now)

def _get_server_key() -> str:
    key = os.getenv("GOOGLE_MAPS_SERVER_KEY") or os.getenv("GOOGLE_PLACES_API_KEY") or ""
    return key.strip()

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

# 1. Route Matrix (computeRouteMatrix)
def compute_route_matrix(origins: List[Dict[str, float]], destinations: List[Dict[str, float]], travel_mode: str = "DRIVE") -> Dict[str, Any]:
    _check_rate_limit()

    if not origins or not destinations:
        raise HTTPException(status_code=400, detail="origins and destinations required")

    # Safety: Cap destinations at 25
    destinations = destinations[:25]

    for pt in origins + destinations:
        if not isinstance(pt.get("lat"), (int, float)) or not isinstance(pt.get("lng"), (int, float)):
            raise HTTPException(status_code=400, detail="Valid lat and lng required for all points")

    cache_key = f"route_{json.dumps(origins)}_{json.dumps(destinations)}_{travel_mode}"
    now = time.time()
    if cache_key in _CACHE and _CACHE[cache_key][1] > now:
        return {**_CACHE[cache_key][0], "cached": True}

    api_key = _get_server_key()
    if not api_key:
        # Graceful haversine fallback approximation
        elements = []
        origin = origins[0]
        for idx, dest in enumerate(destinations):
            dist_km = _haversine_km(origin["lat"], origin["lng"], dest["lat"], dest["lng"])
            # Estimate urban road distance ~1.25x straight-line, 25km/h speed
            road_dist_km = round(dist_km * 1.25, 1)
            duration_mins = max(5, round((road_dist_km / 25.0) * 60.0) + 4)
            elements.append({
                "originIndex": 0,
                "destinationIndex": idx,
                "distanceMeters": int(road_dist_km * 1000),
                "duration": f"{duration_mins * 60}s",
                "condition": "ROUTE_EXISTS",
                "is_fallback": True,
                "distanceKm": road_dist_km,
                "durationMinutes": duration_mins
            })
        result = {"elements": elements, "mode": "haversine_fallback"}
        _CACHE[cache_key] = (result, now + 1800)
        return result

    # Call Google Routes API
    url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    body_dict = {
        "origins": [{"waypoint": {"location": {"latLng": {"latitude": o["lat"], "longitude": o["lng"]}}}} for o in origins],
        "destinations": [{"waypoint": {"location": {"latLng": {"latitude": d["lat"], "longitude": d["lng"]}}}} for d in destinations],
        "travelMode": travel_mode
    }
    data_bytes = json.dumps(body_dict).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "originIndex,destinationIndex,status,distanceMeters,duration,condition"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            result = {"elements": res_data, "source": "routes_api"}
            _CACHE[cache_key] = (result, now + 1800)
            return result
    except Exception as e:
        # Fallback to haversine if Google API call errors
        elements = []
        origin = origins[0]
        for idx, dest in enumerate(destinations):
            dist_km = _haversine_km(origin["lat"], origin["lng"], dest["lat"], dest["lng"])
            road_dist_km = round(dist_km * 1.25, 1)
            duration_mins = max(5, round((road_dist_km / 25.0) * 60.0) + 4)
            elements.append({
                "originIndex": 0,
                "destinationIndex": idx,
                "distanceMeters": int(road_dist_km * 1000),
                "duration": f"{duration_mins * 60}s",
                "is_fallback": True,
                "distanceKm": road_dist_km,
                "durationMinutes": duration_mins
            })
        return {"elements": elements, "mode": "haversine_fallback", "api_error": str(e)}

# 2. Places Nearby Search (Places API New)
def search_places_nearby(lat: float, lng: float, radius: int = 5000, keyword: str = "hospital") -> Dict[str, Any]:
    _check_rate_limit()

    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid lat/lng coordinates")

    radius = max(100, min(50000, radius))
    cache_key = f"nearby_{round(lat, 3)}_{round(lng, 3)}_{radius}_{keyword}"
    now = time.time()
    if cache_key in _CACHE and _CACHE[cache_key][1] > now:
        return {**_CACHE[cache_key][0], "cached": True}

    api_key = _get_server_key()
    if not api_key:
        return {"places": [], "fallback_mode": True, "notice": "GOOGLE_MAPS_SERVER_KEY not configured"}

    url = "https://places.googleapis.com/v1/places:searchNearby"
    body = {
        "includedTypes": ["hospital", "doctor"],
        "maxResultCount": 15,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius
            }
        }
    }
    data_bytes = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.currentOpeningHours,places.photos,places.accessibilityOptions"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            result = {"places": res_data.get("places", []), "attribution": "Data provided by Google Maps", "source": "places_api_new"}
            _CACHE[cache_key] = (result, now + 600)
            return result
    except Exception as e:
        return {"places": [], "error": str(e), "fallback_mode": True}

# 3. Place Details (Places API New)
def get_place_details(place_id: str) -> Dict[str, Any]:
    _check_rate_limit()

    if not place_id or not re.match(r"^[a-zA-Z0-9_\-:]+$", place_id) or len(place_id) < 5 or len(place_id) > 250:
        raise HTTPException(status_code=400, detail="Invalid place_id format")

    cache_key = f"details_{place_id}"
    now = time.time()
    if cache_key in _CACHE and _CACHE[cache_key][1] > now:
        return {**_CACHE[cache_key][0], "cached": True}

    api_key = _get_server_key()
    if not api_key:
        return {"place": None, "fallback_mode": True}

    url = f"https://places.googleapis.com/v1/places/{urllib.parse.quote(place_id)}"
    req = urllib.request.Request(
        url,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location,rating,userRatingCount,nationalPhoneNumber,websiteUri,currentOpeningHours,regularOpeningHours,photos,accessibilityOptions,editorialSummary"
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            result = {"place": res_data, "attribution": "Data provided by Google Maps"}
            _CACHE[cache_key] = (result, now + 3600)
            return result
    except Exception as e:
        return {"place": None, "error": str(e)}

# 4. Place Photo Proxy
def get_place_photo_media(photo_name: str, max_height: int = 600, max_width: int = 800) -> Response:
    _check_rate_limit()

    if not photo_name or not photo_name.startswith("places/"):
        raise HTTPException(status_code=400, detail="Valid places/ photo_name required")

    max_height = max(50, min(1600, max_height))
    max_width = max(50, min(1600, max_width))

    api_key = _get_server_key()
    if not api_key:
        raise HTTPException(status_code=503, detail="GOOGLE_MAPS_SERVER_KEY not configured")

    google_url = f"https://places.googleapis.com/v1/{urllib.parse.quote(photo_name)}/media?maxHeightPx={max_height}&maxWidthPx={max_width}&key={api_key}"
    try:
        with urllib.request.urlopen(google_url, timeout=10) as res:
            content_type = res.headers.get("content-type") or "image/jpeg"
            data = res.read()
            return Response(
                content=data,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400, immutable"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch photo from Google Places: {str(e)}")

# 5. Geocode / Reverse Geocode
def geocode_address(address: Optional[str] = None, lat: Optional[float] = None, lng: Optional[float] = None, language: str = "en") -> Dict[str, Any]:
    _check_rate_limit()

    if not address and (lat is None or lng is None):
        raise HTTPException(status_code=400, detail="address or lat/lng required")

    cache_key = f"geo_{address}_{lat}_{lng}_{language}"
    now = time.time()
    if cache_key in _CACHE and _CACHE[cache_key][1] > now:
        return {**_CACHE[cache_key][0], "cached": True}

    api_key = _get_server_key()
    if not api_key:
        # Fallback offline coordinate mapping
        if address:
            from ..data.india_geography import resolve_location
            res = resolve_location(city=address)
            return {
                "results": [{
                    "formatted_address": f"{res['city']}, {res['state']}" if res.get('state') else address,
                    "geometry": {"location": {"lat": res["lat"], "lng": res["lng"]}}
                }],
                "fallback_mode": True
            }
        return {"results": [{"formatted_address": f"{lat}, {lng}", "geometry": {"location": {"lat": lat, "lng": lng}}}], "fallback_mode": True}

    url = "https://maps.googleapis.com/maps/api/geocode/json?"
    if address:
        url += f"address={urllib.parse.quote(address[:200])}&components=country:IN&language={language}&key={api_key}"
    else:
        url += f"latlng={lat},{lng}&language={language}&key={api_key}"

    try:
        with urllib.request.urlopen(url, timeout=6) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            _CACHE[cache_key] = (res_data, now + 86400)
            return res_data
    except Exception as e:
        return {"results": [], "error": str(e), "fallback_mode": True}
