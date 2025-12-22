"""
GAIA Consumer - Consumes real-time Earth data from Confluent Kafka
Used by FastAPI to serve SSE stream to frontend
"""

import os
import json
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Optional
from dotenv import load_dotenv

load_dotenv()

# Confluent Cloud configuration
CONFLUENT_CONFIG = {
    'bootstrap.servers': os.getenv('CONFLUENT_BOOTSTRAP_SERVERS', ''),
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'sasl.username': os.getenv('CONFLUENT_API_KEY', ''),
    'sasl.password': os.getenv('CONFLUENT_API_SECRET', ''),
    'group.id': 'nexus-gaia-consumer',
    'auto.offset.reset': 'latest',
}

GAIA_TOPIC = 'gaia-updates'
ALERTS_TOPIC = 'gaia-alerts'

# In-memory cache of latest GAIA data (updated by background consumer)
_gaia_cache = {
    "weather": None,
    "news": [],
    "alerts": [],
    "last_update": None
}


def get_cached_gaia_data() -> dict:
    """Get the latest cached GAIA data (non-blocking)"""
    return _gaia_cache.copy()


def update_cache(data: dict):
    """Update the in-memory cache with new data"""
    data_type = data.get("type")
    
    if data_type == "weather":
        _gaia_cache["weather"] = data
    elif data_type == "news":
        # Keep last 5 news items
        _gaia_cache["news"] = [data] + _gaia_cache["news"][:4]
    elif data_type == "alert":
        # Keep last 3 alerts
        _gaia_cache["alerts"] = [data] + _gaia_cache["alerts"][:2]
    
    _gaia_cache["last_update"] = datetime.utcnow().isoformat()


async def consume_gaia_stream():
    """Background task to consume Kafka messages and update cache"""
    from confluent_kafka import Consumer, KafkaError
    
    if not CONFLUENT_CONFIG['bootstrap.servers']:
        print("[GAIA CONSUMER] No Confluent configured. Running in simulation mode.")
        
        # Simulation mode - generate fake data periodically
        while True:
            fake_weather = {
                "type": "weather",
                "temperature": 34,
                "weathercode": 3,
                "timestamp": datetime.utcnow().isoformat()
            }
            update_cache(fake_weather)
            await asyncio.sleep(30)
        return
    
    consumer = Consumer(CONFLUENT_CONFIG)
    consumer.subscribe([GAIA_TOPIC, ALERTS_TOPIC])
    print(f"[GAIA CONSUMER] Subscribed to {GAIA_TOPIC}, {ALERTS_TOPIC}")
    
    while True:
        msg = consumer.poll(1.0)
        
        if msg is None:
            await asyncio.sleep(0.1)
            continue
        
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            print(f"[GAIA CONSUMER ERROR] {msg.error()}")
            continue
        
        try:
            data = json.loads(msg.value().decode('utf-8'))
            update_cache(data)
            print(f"[GAIA CONSUMER] Received: {data.get('type')}")
        except Exception as e:
            print(f"[GAIA CONSUMER] Parse error: {e}")
        
        await asyncio.sleep(0.1)


async def gaia_sse_stream() -> AsyncGenerator[str, None]:
    """SSE stream of GAIA updates for frontend"""
    last_sent = None
    
    while True:
        current = get_cached_gaia_data()
        
        # Only send if data changed
        if current["last_update"] != last_sent:
            yield f"data: {json.dumps(current)}\n\n"
            last_sent = current["last_update"]
        
        await asyncio.sleep(5)  # Send updates every 5 seconds max
