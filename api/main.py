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

# CORS for frontend - allow localhost and Cloud Run
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Cloud Run (will be behind auth if needed)
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

@app.get("/api/gaia/status")
async def gaia_status():
    """Get current GAIA data (weather, time) for UI display"""
    from services.gaia import get_gaia
    
    gaia = get_gaia()
    time_data = gaia.get_current_time()
    weather = await gaia.get_weather()
    
    return {
        "time": time_data,
        "weather": weather,
        "location": weather.get("location", "New York")
    }

@app.get("/api/gaia/news")
async def gaia_news(category: str = "general"):
    """Get news headlines from GAIA"""
    from services.gaia import get_gaia
    
    gaia = get_gaia()
    news = await gaia.get_news_headlines(category=category)
    return news

@app.post("/api/process", response_model=NexusResponse)
@tracer.wrap(service="nexus-api", resource="process_voice")
async def process_voice_input(input_data: VoiceInput):
    """
    Main processing endpoint with ECHO memory
    Flow: Voice Text -> Memory Context -> Gemini -> Store Response -> Return
    """
    try:
        from services.gemini import generate_response
        from services.memory import get_memory
        from services.gaia import get_gaia
        
        # Get memory for this user
        memory = get_memory(input_data.user_id, input_data.session_id)
        
        # Get ECHO context (memory)
        memory_context = memory.get_full_context()
        
        # Get GAIA context (real-time data)
        gaia = get_gaia()
        gaia_context = await gaia.build_context()
        
        # Combine contexts
        full_context = ""
        if gaia_context:
            full_context += f"[Real-time data]\n{gaia_context}\n\n"
        if memory_context:
            full_context += f"{memory_context}"
        
        # Generate response with combined context
        response = await generate_response(input_data.text, full_context)
        response_text = response["text"]
        
        # Store the exchange in memory
        memory.add_exchange(input_data.text, response_text)
        
        return NexusResponse(
            text=response_text,
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
    Full voice round-trip with ECHO memory
    Text -> Memory -> Gemini -> Store -> TTS -> Audio
    """
    import base64
    
    try:
        from services.gemini import generate_response
        from services.elevenlabs import text_to_speech
        from services.memory import get_memory
        from services.gaia import get_gaia
        
        # Get memory for this user
        memory = get_memory(input_data.user_id, input_data.session_id)
        
        # Get ECHO context (memory)
        memory_context = memory.get_full_context()
        
        # Get GAIA context (real-time data)
        gaia = get_gaia()
        gaia_context = await gaia.build_context()
        
        # Get PROMETHEUS context (web search for real-time info)
        from services.prometheus import search_if_needed
        search_context = await search_if_needed(input_data.text)
        
        # Combine contexts
        full_context = ""
        if search_context:
            full_context += f"[Web search results]\n{search_context}\n\n"
        if gaia_context:
            full_context += f"[Real-time data]\n{gaia_context}\n\n"
        if memory_context:
            full_context += f"{memory_context}"
        
        # Get Gemini response with combined context
        response = await generate_response(input_data.text, full_context)
        response_text = response["text"]
        
        # Store the exchange in memory
        memory.add_exchange(input_data.text, response_text)
        
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


# ============ STREAMING ENDPOINT ============

from fastapi.responses import StreamingResponse
import json

@app.post("/api/stream")
async def stream_response(input_data: VoiceInput):
    """
    Streaming response endpoint - text appears word-by-word like ChatGPT.
    Uses Server-Sent Events (SSE) for real-time streaming.
    """
    from services.gemini import generate_response_stream
    from services.memory import get_memory
    from services.gaia import get_gaia
    from services.prometheus import search_if_needed
    
    async def generate():
        try:
            # Get memory
            memory = get_memory(input_data.user_id, input_data.session_id)
            memory_context = memory.get_full_context()
            
            # Get GAIA context
            gaia = get_gaia()
            gaia_context = await gaia.build_context()
            
            # Get PROMETHEUS search context WITH sources for citations
            from services.prometheus import search_with_sources
            search_context, sources = await search_with_sources(input_data.text)
            
            # Combine contexts
            full_context = ""
            if search_context:
                full_context += f"[Web search results]\n{search_context}\n\n"
            if gaia_context:
                full_context += f"[Real-time data]\n{gaia_context}\n\n"
            if memory_context:
                full_context += f"{memory_context}"
            
            # Stream the response
            full_response = ""
            async for chunk in generate_response_stream(input_data.text, full_context):
                full_response += chunk
                # Send chunk as SSE event
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Store in memory after complete
            memory.add_exchange(input_data.text, full_response)
            
            # Send done event WITH sources for citation display
            yield f"data: {json.dumps({'done': True, 'full_text': full_response, 'sources': sources})}\n\n"
            
        except Exception as e:
            print(f"[ERROR] Streaming failed: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


# ============ ECHO MEMORY ENDPOINTS ============

@app.get("/api/echo/profile")
async def get_echo_profile(user_id: str = "demo-user", session_id: str = "demo-session"):
    """
    Get what NEXUS knows about the user - for the Memory Panel UI
    This makes NEXUS different: you can SEE what it remembers!
    """
    from services.memory import MemoryManager
    
    # Create fresh memory manager to reload from disk
    memory = MemoryManager(user_id, session_id)
    profile = memory.profile.data
    conversation = memory.conversation
    
    # Count conversations
    total_messages = len(conversation.messages)
    user_messages = sum(1 for m in conversation.messages if m.get("role") == "user")
    
    return {
        "user_id": user_id,
        "name": profile.get("name"),
        "facts": profile.get("facts", []),
        "preferences": profile.get("preferences", {}),
        "stats": {
            "total_conversations": total_messages // 2,
            "messages_sent": user_messages,
            "first_seen": profile.get("created_at"),
            "last_seen": profile.get("updated_at")
        },
        "memory_active": True
    }


@app.get("/api/echo/greeting")
async def get_proactive_greeting(user_id: str = "demo-user"):
    """
    SENTINEL MODE: Generate a Situation Report greeting.
    Makes NEXUS feel like an AI that watched the world while you were away.
    """
    from services.memory import get_memory
    from services.gaia import get_gaia
    from consumers.gaia_consumer import get_cached_gaia_data
    
    memory = get_memory(user_id)
    gaia = get_gaia()
    
    user_name = memory.get_user_name() or "Commander"
    time_data = gaia.get_current_time()
    weather = await gaia.get_weather()
    
    # Get cached GAIA real-time data (from Kafka)
    gaia_realtime = get_cached_gaia_data()
    
    # Get last conversation topic
    recent_messages = memory.conversation.get_context_window(2)
    last_topic = ""
    if recent_messages:
        for msg in reversed(recent_messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")[:60]
                if content:
                    last_topic = content
                break
    
    # Build time context
    hour = int(time_data.get("time", "12:00").split(":")[0])
    time_greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
    
    # Build status items
    status_items = []
    
    # Weather status
    if weather.get("description"):
        temp = weather.get("temp") or weather.get("temperature", 0)
        status_items.append(f"Temperature: {temp}°F, {weather.get('description')}")
    
    # Get alerts from GAIA cache
    alerts = gaia_realtime.get("alerts", [])
    if alerts:
        latest_alert = alerts[0]
        status_items.append(f"Alert: {latest_alert.get('message', 'No active alerts')}")
    
    # Memory status
    memory_facts = memory.get_user_facts()
    memory_count = len(memory_facts) if isinstance(memory_facts, list) else 0
    
    # Build the Sentinel-style greeting
    greeting_parts = [
        f"**System Online.** {time_greeting}, {user_name}.",
        "",
        "**SITREP:**"
    ]
    
    for item in status_items:
        greeting_parts.append(f"• {item}")
    
    if last_topic:
        greeting_parts.append("")
        greeting_parts.append(f"**Memory:** We last discussed: \"{last_topic}...\"")
    
    if memory_count > 0:
        greeting_parts.append(f"**Profile:** {memory_count} facts remembered about you.")
    
    greeting_parts.append("")
    greeting_parts.append("What are your orders?")
    
    full_greeting = "\n".join(greeting_parts)
    
    # Also return a simple version for the UI header
    simple_greeting = f"{time_greeting}, {user_name}"
    
    return {
        "greeting": simple_greeting,
        "sitrep": full_greeting,
        "context": {
            "time_of_day": time_greeting.split()[-1].lower(),
            "weather": weather.get("description", "unknown"),
            "temperature": weather.get("temp") or weather.get("temperature"),
            "user_known": user_name != "Commander",
            "has_history": len(recent_messages) > 0,
            "last_topic": last_topic,
            "alerts": alerts[:2] if alerts else [],
            "memory_facts_count": memory_count
        },
        "proactive": True,
        "mode": "sentinel"
    }


@app.get("/api/echo/insights")
async def get_context_insights(query: str = ""):
    """
    Get context cards showing what data sources were used.
    This shows transparency - users see WHERE info came from.
    """
    from services.gaia import get_gaia
    from services.prometheus import search_if_needed
    
    insights = []
    
    # GAIA insight
    gaia = get_gaia()
    weather = await gaia.get_weather()
    time_data = gaia.get_current_time()
    
    insights.append({
        "source": "GAIA",
        "type": "real_time",
        "icon": "🌍",
        "data": {
            "weather": f"{weather.get('temperature', 'N/A')}, {weather.get('condition', 'Unknown')}",
            "time": time_data.get("formatted", "Unknown"),
            "location": weather.get("location", "Unknown")
        }
    })
    
    # PROMETHEUS insight (if query provided)
    if query:
        search_context = await search_if_needed(query)
        if search_context:
            insights.append({
                "source": "PROMETHEUS",
                "type": "web_search",
                "icon": "🔍",
                "data": {
                    "query": query,
                    "results_used": True,
                    "sources_count": search_context.count("SOURCE")
                }
            })
    
    # Memory insight
    insights.append({
        "source": "ECHO",
        "type": "memory",
        "icon": "🧠",
        "data": {
            "status": "active",
            "remembering": True
        }
    })
    
    return {"insights": insights}


# ============ GAIA STREAMING (Confluent Kafka) ============

@app.get("/api/gaia/stream")
async def gaia_stream():
    """
    SSE stream of real-time GAIA data from Confluent Kafka
    This proves "Real-Time Event Architecture" for Confluent track
    """
    from fastapi.responses import StreamingResponse
    from consumers.gaia_consumer import gaia_sse_stream
    
    return StreamingResponse(
        gaia_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/gaia/realtime")
async def gaia_realtime():
    """Get cached real-time GAIA data (non-streaming)"""
    from consumers.gaia_consumer import get_cached_gaia_data
    return get_cached_gaia_data()


# ============ STARTUP ============

@app.on_event("startup")
async def startup_event():
    import asyncio
    from consumers.gaia_consumer import consume_gaia_stream
    
    print("[NEXUS] API Starting...")
    print("[NEXUS] Gemini (Vertex AI): Active")
    print("[NEXUS] ECHO Memory: Active")
    print("[NEXUS] GAIA Data Streams: Active")
    print("[NEXUS] ElevenLabs TTS: Active")
    
    # Start background Kafka consumer for GAIA real-time data
    asyncio.create_task(consume_gaia_stream())
    print("[NEXUS] GAIA Kafka Consumer: Started")
    
    if not DD_ENABLED:
        print("[NEXUS] Datadog: DISABLED (Local Mode)")
    else:
        print("[NEXUS] Datadog: ACTIVE")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)