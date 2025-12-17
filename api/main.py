"""
NEXUS API - Main FastAPI Application
Day 1: Tracer Bullet Implementation
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from ddtrace import tracer, patch_all

# Load environment variables first
load_dotenv()

# ============ DATADOG CONFIGURATION ============
# Only enable Datadog tracing if explicitly configured
DD_ENABLED = os.getenv("DD_TRACE_ENABLED", "false").lower() == "true"

if DD_ENABLED:
    patch_all()
else:
    # Disable tracer when DD agent is not running locally
    tracer.enabled = False

# ============ FASTAPI SETUP ============

app = FastAPI(
    title="NEXUS API",
    description="The Consciousness Layer of Reality",
    version="0.1.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://nexus.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ MODELS ============

class VoiceInput(BaseModel):
    """Input from voice transcription"""
    text: str
    user_id: str = "default"
    session_id: str = "default"

class NexusResponse(BaseModel):
    """Response from NEXUS"""
    text: str
    confidence: float = 1.0
    sources: list[str] = []

# ============ ROUTES ============

@app.get("/")
async def root():
    return {"status": "online", "service": "NEXUS API", "version": "0.1.0"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "datadog": "active" if DD_ENABLED else "disabled (local mode)"
    }

@app.post("/api/process", response_model=NexusResponse)
@tracer.wrap(service="nexus-api", resource="process_voice")
async def process_voice_input(input_data: VoiceInput):
    """
    Main processing endpoint - The Tracer Bullet
    Flow: Voice Text -> Gemini -> Response
    """
    try:
        from services.gemini import generate_response
        response = await generate_response(input_data.text)
        
        return NexusResponse(
            text=response["text"],
            confidence=response.get("confidence", 1.0),
            sources=response.get("sources", [])
        )
    except Exception as e:
        print(f"[ERROR] Processing failed: {e}")
        return NexusResponse(text="I'm having trouble processing that. Let me try again.", confidence=0.0)

@app.post("/api/process-with-voice")
@tracer.wrap(service="nexus-api", resource="process_voice_tts")
async def process_with_voice(input_data: VoiceInput):
    """
    Full voice round-trip: Text -> Gemini -> TTS -> Audio
    Returns both text and audio
    """
    import base64
    
    try:
        from services.gemini import generate_response
        from services.elevenlabs import text_to_speech
        
        # Get Gemini response
        response = await generate_response(input_data.text)
        response_text = response["text"]
        
        # Convert to speech
        audio_bytes = text_to_speech(response_text)
        audio_b64 = None
        if audio_bytes:
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return {
            "text": response_text,
            "confidence": response.get("confidence", 1.0),
            "sources": response.get("sources", []),
            "audio": audio_b64,
            "audio_format": "mp3" if audio_b64 else None
        }
    except Exception as e:
        print(f"[ERROR] Voice processing failed: {e}")
        return {"text": "I'm having trouble right now.", "audio": None}

# ============ STARTUP ============

@app.on_event("startup")
async def startup_event():
    print("[NEXUS] API Starting...")
    print("[NEXUS] Gemini: Active")
    print("[NEXUS] ElevenLabs TTS: Active")
    if not DD_ENABLED:
        print("[NEXUS] Datadog: DISABLED (Local Mode)")
    else:
        print("[NEXUS] Datadog: ACTIVE")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)