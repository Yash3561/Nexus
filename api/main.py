"""
NEXUS API - Main FastAPI Application
Day 1: Tracer Bullet Implementation
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from ddtrace import tracer, patch_all

# Patch all supported libraries for Datadog tracing
patch_all()

# Load environment variables
load_dotenv()

# Initialize FastAPI app
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


# ============ Request/Response Models ============

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


# ============ Health Check ============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "service": "NEXUS API", "version": "0.1.0"}


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "kafka": "pending",  # Will be implemented
        "gemini": "pending",  # Will be implemented
        "datadog": "active"
    }


# ============ Core Endpoints ============

@app.post("/api/process", response_model=NexusResponse)
@tracer.wrap(service="nexus-api", resource="process_voice")
async def process_voice_input(input_data: VoiceInput):
    """
    Main processing endpoint - The Tracer Bullet
    
    Flow: Voice Text -> Kafka -> Gemini -> Response
    """
    from services.gemini import generate_response
    from services.kafka_producer import publish_to_kafka
    
    # Step 1: Log input to Kafka (async, non-blocking)
    await publish_to_kafka("user-voice-input", {
        "text": input_data.text,
        "user_id": input_data.user_id,
        "session_id": input_data.session_id
    })
    
    # Step 2: Process with Gemini
    response = await generate_response(input_data.text)
    
    # Step 3: Log response to Kafka
    await publish_to_kafka("agent-response", {
        "text": response["text"],
        "user_id": input_data.user_id
    })
    
    return NexusResponse(
        text=response["text"],
        confidence=response.get("confidence", 1.0),
        sources=response.get("sources", [])
    )


# ============ Debug Endpoints (Day 1 Testing) ============

@app.post("/api/debug/echo")
async def debug_echo(input_data: VoiceInput):
    """Simple echo for testing the pipeline"""
    return {"echo": input_data.text, "received": True}


@app.post("/api/debug/kafka")
async def debug_kafka(input_data: VoiceInput):
    """Test Kafka connection"""
    from services.kafka_producer import publish_to_kafka
    
    success = await publish_to_kafka("debug-stream", {
        "text": input_data.text,
        "test": True
    })
    
    return {"published": success, "topic": "debug-stream"}


@app.post("/api/debug/gemini")
async def debug_gemini(input_data: VoiceInput):
    """Test Gemini connection"""
    from services.gemini import generate_response
    
    response = await generate_response(input_data.text)
    return response


# ============ Startup/Shutdown ============

@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    print("[NEXUS] API Starting...")
    print("[NEXUS] Initializing Kafka connection...")
    print("[NEXUS] Initializing Gemini connection...")
    print("[NEXUS] Datadog tracing active")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("[NEXUS] API Shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
