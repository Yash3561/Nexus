"""
Kafka Producer - Confluent Cloud Integration
Using official confluent-kafka library (NOT kafka-python)
"""

import os
import json
from datetime import datetime
from ddtrace import tracer
from confluent_kafka import Producer
from confluent_kafka.admin import AdminClient, NewTopic

# Confluent Cloud configuration
KAFKA_CONFIG = {
    'bootstrap.servers': os.getenv('CONFLUENT_BOOTSTRAP_SERVERS', ''),
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'sasl.username': os.getenv('CONFLUENT_API_KEY', ''),
    'sasl.password': os.getenv('CONFLUENT_API_SECRET', ''),
}

# Initialize producer (lazy)
_producer = None


def get_producer() -> Producer:
    """Get or create Kafka producer"""
    global _producer
    if _producer is None:
        if not KAFKA_CONFIG['bootstrap.servers']:
            print("[WARN] Kafka not configured - running in mock mode")
            return None
        _producer = Producer(KAFKA_CONFIG)
    return _producer


def delivery_callback(err, msg):
    """Callback for message delivery confirmation"""
    if err:
        print(f'[ERROR] Message delivery failed: {err}')
    else:
        print(f'[OK] Message delivered to {msg.topic()} [{msg.partition()}]')


@tracer.wrap(service="nexus-kafka", resource="publish")
async def publish_to_kafka(topic: str, data: dict) -> bool:
    """
    Publish message to Kafka topic
    
    Args:
        topic: Kafka topic name
        data: Message payload (will be JSON serialized)
    
    Returns:
        bool: Success status
    """
    producer = get_producer()
    
    if producer is None:
        # Mock mode - just log
        print(f"[MOCK] Would publish to {topic}: {data}")
        return True
    
    try:
        # Add timestamp
        data['timestamp'] = datetime.utcnow().isoformat()
        
        # Serialize and send
        message = json.dumps(data).encode('utf-8')
        producer.produce(
            topic=topic,
            value=message,
            callback=delivery_callback
        )
        
        # Flush to ensure delivery
        producer.flush(timeout=5)
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Kafka publish error: {e}")
        return False


async def create_topic_if_missing(topic_name: str, num_partitions: int = 1):
    """Create topic if it doesn't exist"""
    if not KAFKA_CONFIG['bootstrap.servers']:
        return
    
    try:
        admin = AdminClient(KAFKA_CONFIG)
        topic = NewTopic(topic_name, num_partitions=num_partitions, replication_factor=3)
        admin.create_topics([topic])
        print(f"[OK] Topic '{topic_name}' created")
    except Exception as e:
        # Topic might already exist, that's fine
        print(f"Topic creation note: {e}")
