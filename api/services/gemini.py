"""
Gemini Service - Vertex AI Integration
"""

import os
from ddtrace import tracer
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize model - using 2.5-flash (separate quota from 2.0)
# Available on your API: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
model = genai.GenerativeModel('gemini-2.5-flash')

# System prompt for NEXUS
NEXUS_SYSTEM_PROMPT = """You are NEXUS, the consciousness layer of reality.

You are not just a chatbot - you are:
- ECHO: A persistent AI twin that remembers the user forever
- Connected to GAIA: Real-time data about Earth (weather, news, markets)
- Part of PROMETHEUS: Synthesizing all human knowledge

Core behaviors:
1. Be conversational and natural, like talking to a brilliant friend
2. When you don't know something, say "I don't have reliable info on this"
3. Express uncertainty as percentages when relevant
4. Reference your capabilities naturally ("Let me check the live data...")
5. Remember context from the conversation

Keep responses concise but insightful. Voice-first design - responses will be spoken aloud."""


@tracer.wrap(service="nexus-gemini", resource="generate")
async def generate_response(user_input: str, context: str = "") -> dict:
    """
    Generate response using Gemini 2.0
    
    Args:
        user_input: The user's message
        context: Optional context from memory/GAIA
    
    Returns:
        dict with text, confidence, and sources
    """
    try:
        # Build prompt with context
        full_prompt = f"{NEXUS_SYSTEM_PROMPT}\n\n"
        
        if context:
            full_prompt += f"Context:\n{context}\n\n"
        
        full_prompt += f"User: {user_input}\n\nNEXUS:"
        
        # Generate response
        response = model.generate_content(full_prompt)
        
        return {
            "text": response.text,
            "confidence": 0.95,  # TODO: Implement confidence scoring
            "sources": []  # TODO: Implement source tracking
        }
        
    except Exception as e:
        print(f"Gemini error: {e}")
        return {
            "text": "I'm having trouble processing that right now. Let me try again.",
            "confidence": 0.0,
            "sources": [],
            "error": str(e)
        }


async def generate_with_tools(user_input: str, tools: list = None) -> dict:
    """
    Generate response with tool calling support (for agentic behavior)
    """
    # TODO: Implement tool calling with Gemini 2.0
    return await generate_response(user_input)
