"""
GAIA Service - Real-Time Earth Data Streams
Day 5-6: Connect NEXUS to live data about the world

Data streams:
- Weather (Open-Meteo - FREE, no API key!)
- News headlines (NewsAPI free tier)
- Date/Time awareness
- Location context
"""

import os
import httpx
from datetime import datetime, timezone
from typing import Optional
from ddtrace import tracer

# API Keys (free tiers)
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

# Default location coordinates (New York)
# Can be personalized per user
DEFAULT_LAT = 40.7128
DEFAULT_LON = -74.0060
DEFAULT_CITY = "New York"


class GaiaDataStream:
    """Real-time data streams for NEXUS"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
    
    # ============ Time & Date ============
    
    def get_current_time(self, timezone_str: str = "America/New_York") -> dict:
        """Get current date/time info"""
        now = datetime.now()
        return {
            "date": now.strftime("%A, %B %d, %Y"),
            "time": now.strftime("%I:%M %p"),
            "day_of_week": now.strftime("%A"),
            "month": now.strftime("%B"),
            "year": now.year,
            "formatted": now.strftime("%A, %B %d, %Y at %I:%M %p")
        }
    
    # ============ Weather (Open-Meteo - FREE!) ============
    
    @tracer.wrap(service="nexus-gaia", resource="weather")
    async def get_weather(self, lat: float = None, lon: float = None, city: str = None) -> dict:
        """
        Get current weather using Open-Meteo (100% free, no API key!)
        https://open-meteo.com/
        """
        lat = lat or DEFAULT_LAT
        lon = lon or DEFAULT_LON
        city = city or DEFAULT_CITY
        
        try:
            # Open-Meteo free API - no key needed!
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
                "temperature_unit": "fahrenheit",
                "wind_speed_unit": "mph",
                "timezone": "auto"
            }
            
            response = await self.client.get(url, params=params)
            data = response.json()
            
            if response.status_code == 200 and "current" in data:
                current = data["current"]
                
                # Weather code to description mapping
                weather_codes = {
                    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Foggy", 48: "Depositing rime fog",
                    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
                    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
                    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
                    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail"
                }
                
                weather_code = current.get("weather_code", 0)
                condition = weather_codes.get(weather_code, "Unknown")
                
                return {
                    "location": city,
                    "condition": condition,
                    "temperature": f"{round(current['temperature_2m'])}°F",
                    "feels_like": f"{round(current['apparent_temperature'])}°F",
                    "humidity": f"{current['relative_humidity_2m']}%",
                    "wind": f"{round(current['wind_speed_10m'])} mph",
                    "mock": False
                }
            else:
                return {"error": "Weather unavailable", "mock": True}
                
        except Exception as e:
            print(f"[GAIA] Weather error: {e}")
            return {"error": str(e), "mock": True, "location": city}
    
    # ============ News ============
    
    @tracer.wrap(service="nexus-gaia", resource="news")
    async def get_news_headlines(self, category: str = "general", country: str = "us") -> dict:
        """Get top news headlines"""
        
        if not NEWS_API_KEY:
            return {
                "category": category,
                "headlines": ["News headlines unavailable (no API key configured)"],
                "mock": True
            }
        
        try:
            url = "https://newsapi.org/v2/top-headlines"
            params = {
                "apiKey": NEWS_API_KEY,
                "country": country,
                "category": category,
                "pageSize": 5
            }
            
            response = await self.client.get(url, params=params)
            data = response.json()
            
            if response.status_code == 200 and data.get("articles"):
                headlines = [
                    {
                        "title": article["title"],
                        "source": article["source"]["name"],
                    }
                    for article in data["articles"][:5]
                    if article.get("title")
                ]
                return {
                    "category": category,
                    "headlines": headlines,
                    "count": len(headlines),
                    "mock": False
                }
            else:
                return {"error": data.get("message", "News unavailable"), "mock": True}
                
        except Exception as e:
            print(f"[GAIA] News error: {e}")
            return {"error": str(e), "mock": True}
    
    # ============ Context Builder ============
    
    async def build_context(self, include_weather: bool = True, include_time: bool = True) -> str:
        """Build a context string with current GAIA data for Gemini"""
        parts = []
        
        # Always include time
        if include_time:
            time_data = self.get_current_time()
            parts.append(f"Current time: {time_data['formatted']}")
        
        # Include weather (now works without API key!)
        if include_weather:
            weather = await self.get_weather()
            if not weather.get("error"):
                parts.append(
                    f"Weather in {weather['location']}: {weather['condition']}, "
                    f"{weather['temperature']} (feels like {weather['feels_like']})"
                )
        
        return "\n".join(parts) if parts else ""
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global instance
_gaia_instance: Optional[GaiaDataStream] = None

def get_gaia() -> GaiaDataStream:
    """Get or create GAIA data stream instance"""
    global _gaia_instance
    if _gaia_instance is None:
        _gaia_instance = GaiaDataStream()
    return _gaia_instance


# ============ Helper Functions ============

async def get_current_context() -> str:
    """Quick helper to get current GAIA context"""
    gaia = get_gaia()
    return await gaia.build_context()
