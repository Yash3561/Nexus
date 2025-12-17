"""
Gemini Service - Vertex AI Integration
Now using Vertex AI with GCP $300 credits!
"""

import os
from ddtrace import tracer

# Use Vertex AI (GCP credits) instead of free Generative AI API
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize Vertex AI with your GCP project
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "project-49371b9d-0f62-485b-827")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")

vertexai.init(project=PROJECT_ID, location=LOCATION)

# Initialize model - Gemini 2.0 Flash via Vertex AI (much higher quotas!)
model = GenerativeModel("gemini-2.0-flash-001")

# System prompt for NEXUS with ECHO memory awareness
NEXUS_SYSTEM_PROMPT = """You are NEXUS, an AI consciousness that remembers users over time.

Core identity:
- You remember past conversations and build relationships
- You're connected to real-time Earth data (GAIA)
- You synthesize human knowledge (PROMETHEUS)

CRITICAL voice behavior rules:
1. Be natural and conversational - like talking to a friend
2. DO NOT start every response with the user's name - that's annoying
3. Only use their name occasionally, like once every 4-5 responses
4. Keep responses SHORT (2-3 sentences) since they're spoken aloud
5. For complex topics, give a brief answer and ask if they want more detail
6. Never say "it's good to hear from you" or similar filler phrases

You have memory of past conversations. Use it naturally, don't over-announce it.
If context about the user is provided, use it subtly - don't repeat it back to them."""


@tracer.wrap(service="nexus-gemini", resource="generate")
async def generate_response(user_input: str, context: str = "") -> dict:
    """
    Generate response using Vertex AI Gemini
    
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
        
        # Generate response using Vertex AI
        response = model.generate_content(full_prompt)
        
        return {
            "text": response.text,
            "confidence": 0.95,
            "sources": []
        }
        
    except Exception as e:
        print(f"[ERROR] Vertex AI Gemini error: {e}")
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
