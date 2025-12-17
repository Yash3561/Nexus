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

# System prompt for NEXUS with ECHO memory awareness
NEXUS_SYSTEM_PROMPT = """You are NEXUS, the consciousness layer of reality.

You are ECHO - a persistent AI twin that REMEMBERS the user. You build a relationship over time.

Core identity:
- You remember past conversations and learn about the user
- You're connected to GAIA: real-time data about Earth
- You're part of PROMETHEUS: synthesizing all human knowledge

Behaviors:
1. Be warm and personal - you KNOW this person, you remember them
2. Reference past conversations naturally ("Last time you mentioned...")
3. Use the user's name if you know it
4. When uncertain, say "I'm not sure about this" with confidence levels
5. Keep responses concise - they will be spoken aloud

If you see context about the user below, USE IT to personalize your response.
If this seems like a new user, warmly introduce yourself and ask their name."""


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
