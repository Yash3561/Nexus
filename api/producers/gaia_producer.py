"""
GAIA Producer - Streams real-time Earth data to Confluent Kafka
Run this as a background process: python -m producers.gaia_producer
"""

import os
import json
import time
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Confluent Cloud configuration
CONFLUENT_CONFIG = {
    'bootstrap.servers': os.getenv('CONFLUENT_BOOTSTRAP_SERVERS', ''),
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'sasl.username': os.getenv('CONFLUENT_API_KEY', ''),
    'sasl.password': os.getenv('CONFLUENT_API_SECRET', ''),
}

# Topics
GAIA_TOPIC = 'gaia-updates'
ALERTS_TOPIC = 'gaia-alerts'

# Weather API
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
NEWS_API_KEY = os.getenv('NEWS_API_KEY', '')


async def fetch_weather(lat: float = 40.7128, lon: float = -74.0060) -> dict:
    """Fetch current weather for location (default: NYC)"""
    import httpx
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": True,
        "timezone": "auto"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WEATHER_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                weather = data.get("current_weather", {})
                return {
                    "type": "weather",
                    "temperature": weather.get("temperature"),
                    "windspeed": weather.get("windspeed"),
                    "weathercode": weather.get("weathercode"),
                    "timestamp": datetime.utcnow().isoformat(),
                    "location": {"lat": lat, "lon": lon}
                }
        except Exception as e:
            print(f"Weather fetch error: {e}")
    return {}


async def fetch_news_headlines() -> list:
    """Fetch top news headlines"""
    import httpx
    
    if not NEWS_API_KEY:
        return []
    
    url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey={NEWS_API_KEY}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])[:5]
                return [
                    {
                        "type": "news",
                        "title": a.get("title", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    for a in articles
                ]
        except Exception as e:
            print(f"News fetch error: {e}")
    return []


def create_alert() -> dict:
    """Generate simulated alert (for demo purposes)"""
    import random
    
    alerts = [
        {"alert_type": "seismic", "message": "Minor seismic activity detected in Pacific Ring", "severity": "low"},
        {"alert_type": "weather", "message": "Storm system approaching Eastern seaboard", "severity": "medium"},
        {"alert_type": "market", "message": "Crypto market volatility spike detected", "severity": "low"},
        {"alert_type": "global", "message": "Unusual network activity in HIVEMIND", "severity": "info"},
    ]
    
    alert = random.choice(alerts)
    alert["timestamp"] = datetime.utcnow().isoformat()
    alert["type"] = "alert"
    return alert


def send_to_kafka(producer, topic: str, data: dict):
    """Send message to Kafka topic"""
    try:
        producer.produce(
            topic,
            key=data.get("type", "unknown"),
            value=json.dumps(data).encode('utf-8')
        )
        producer.flush()
        print(f"[KAFKA] Sent to {topic}: {data.get('type')}")
    except Exception as e:
        print(f"[KAFKA ERROR] {e}")


async def run_producer():
    """Main producer loop - runs every 60 seconds"""
    from confluent_kafka import Producer
    
    if not CONFLUENT_CONFIG['bootstrap.servers']:
        print("[ERROR] Confluent not configured. Set CONFLUENT_BOOTSTRAP_SERVERS in .env")
        print("[FALLBACK] Running in simulation mode...")
        
        # Simulation mode - just print what would be sent
        while True:
            weather = await fetch_weather()
            news = await fetch_news_headlines()
            alert = create_alert()
            
            print(f"\n[GAIA STREAM] {datetime.utcnow().isoformat()}")
            print(f"  Weather: {weather.get('temperature')}°C")
            print(f"  News: {len(news)} headlines")
            print(f"  Alert: {alert.get('message')}")
            
            await asyncio.sleep(60)
    
    # Real Kafka mode
    producer = Producer(CONFLUENT_CONFIG)
    print("[GAIA PRODUCER] Connected to Confluent Cloud")
    print(f"[GAIA PRODUCER] Streaming to topics: {GAIA_TOPIC}, {ALERTS_TOPIC}")
    
    while True:
        # Fetch and send weather
        weather = await fetch_weather()
        if weather:
            send_to_kafka(producer, GAIA_TOPIC, weather)
        
        # Fetch and send news
        news = await fetch_news_headlines()
        for article in news:
            send_to_kafka(producer, GAIA_TOPIC, article)
        
        # Send occasional alerts (every 5th cycle)
        import random
        if random.random() < 0.2:  # 20% chance each cycle
            alert = create_alert()
            send_to_kafka(producer, ALERTS_TOPIC, alert)
        
        print(f"[GAIA PRODUCER] Cycle complete. Sleeping 60s...")
        await asyncio.sleep(60)


if __name__ == "__main__":
    print("=" * 50)
    print("NEXUS GAIA PRODUCER - Real-Time Earth Data Stream")
    print("=" * 50)
    asyncio.run(run_producer())
