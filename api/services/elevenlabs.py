"""
ElevenLabs Service - Text-to-Speech Integration
Day 2: Voice Round-Trip
"""

import os
import io
from typing import AsyncGenerator
from ddtrace import tracer

# ElevenLabs SDK
try:
    from elevenlabs import ElevenLabs
    from elevenlabs.client import AsyncElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("[WARN] ElevenLabs not installed. Running in mock mode.")

# Configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Default voice settings
DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # Adam - deep, professional voice
# Other good options:
# "21m00Tcm4TlvDq8ikWAM" - Rachel (female, warm)
# "AZnzlk1XvdvUeBnXmlld" - Domi (female, strong)
# "EXAVITQu4vr4xnSDxMaL" - Bella (female, soft)
# "ErXwobaYiN019PkySvjV" - Antoni (male, dynamic)


def get_client() -> ElevenLabs | None:
    """Get ElevenLabs client"""
    if not ELEVENLABS_AVAILABLE:
        return None
    if not ELEVENLABS_API_KEY:
        print("[WARN] ELEVENLABS_API_KEY not set. TTS disabled.")
        return None
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)


def get_async_client() -> AsyncElevenLabs | None:
    """Get async ElevenLabs client for streaming"""
    if not ELEVENLABS_AVAILABLE:
        return None
    if not ELEVENLABS_API_KEY:
        return None
    return AsyncElevenLabs(api_key=ELEVENLABS_API_KEY)


@tracer.wrap(service="nexus-elevenlabs", resource="tts")
def text_to_speech(text: str, voice_id: str = DEFAULT_VOICE_ID) -> bytes | None:
    """
    Convert text to speech audio (synchronous)
    
    Args:
        text: Text to convert to speech
        voice_id: ElevenLabs voice ID
    
    Returns:
        Audio bytes (mp3) or None if unavailable
    """
    client = get_client()
    
    if client is None:
        print(f"[MOCK TTS] Would speak: {text[:50]}...")
        return None
    
    try:
        # Generate audio
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2_5",  # Fastest model, ~300ms latency
            output_format="mp3_44100_128"
        )
        
        # Collect all chunks into bytes
        audio_bytes = b"".join(audio)
        print(f"[TTS] Generated {len(audio_bytes)} bytes of audio")
        return audio_bytes
        
    except Exception as e:
        print(f"[ERROR] ElevenLabs TTS error: {e}")
        return None


@tracer.wrap(service="nexus-elevenlabs", resource="tts-stream")
async def text_to_speech_stream(
    text: str, 
    voice_id: str = DEFAULT_VOICE_ID
) -> AsyncGenerator[bytes, None]:
    """
    Stream text-to-speech audio (for low latency)
    
    Yields audio chunks as they're generated.
    """
    client = get_async_client()
    
    if client is None:
        print(f"[MOCK TTS STREAM] Would speak: {text[:50]}...")
        return
    
    try:
        # Stream audio generation
        async for chunk in client.text_to_speech.convert_as_stream(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2_5",
            output_format="mp3_44100_128"
        ):
            yield chunk
            
    except Exception as e:
        print(f"[ERROR] ElevenLabs streaming error: {e}")


async def get_available_voices() -> list:
    """Get list of available voices"""
    client = get_client()
    
    if client is None:
        return []
    
    try:
        voices = client.voices.get_all()
        return [
            {"id": v.voice_id, "name": v.name, "category": v.category}
            for v in voices.voices
        ]
    except Exception as e:
        print(f"[ERROR] Failed to get voices: {e}")
        return []
