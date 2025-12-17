"""
ECHO Memory System - The Remembering Layer
Day 3-4: Make NEXUS remember conversations and user preferences

Architecture:
- Short-term: Recent conversation window (in-memory)
- Long-term: JSON file storage (upgradeable to vector DB)
- User profiles: Preferences and learned facts
"""

import os
import json
from datetime import datetime
from typing import Optional
from pathlib import Path
from ddtrace import tracer

# Memory storage directory
MEMORY_DIR = Path(os.getenv("MEMORY_DIR", "./memory"))
MEMORY_DIR.mkdir(exist_ok=True)

# Configuration
MAX_SHORT_TERM_MESSAGES = 20  # Keep last N messages in context
MAX_CONTEXT_TOKENS = 4000     # Approximate context limit for Gemini


class ConversationMemory:
    """Manages conversation history for a session"""
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.messages: list[dict] = []
        self.session_file = MEMORY_DIR / f"session_{session_id}.json"
        self._load()
    
    def _load(self):
        """Load existing session if available"""
        if self.session_file.exists():
            try:
                data = json.loads(self.session_file.read_text())
                self.messages = data.get("messages", [])
            except Exception as e:
                print(f"[MEMORY] Failed to load session: {e}")
                self.messages = []
    
    def _save(self):
        """Persist session to disk"""
        try:
            data = {
                "session_id": self.session_id,
                "messages": self.messages,
                "updated_at": datetime.utcnow().isoformat()
            }
            self.session_file.write_text(json.dumps(data, indent=2))
        except Exception as e:
            print(f"[MEMORY] Failed to save session: {e}")
    
    def add_message(self, role: str, content: str, metadata: dict = None):
        """Add a message to the conversation history"""
        message = {
            "role": role,  # "user" or "nexus"
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self._save()
        return message
    
    def get_context_window(self, max_messages: int = None) -> list[dict]:
        """Get recent messages for context"""
        limit = max_messages or MAX_SHORT_TERM_MESSAGES
        return self.messages[-limit:]
    
    def format_for_gemini(self, max_messages: int = None) -> str:
        """Format conversation history for Gemini prompt"""
        context = self.get_context_window(max_messages)
        if not context:
            return ""
        
        formatted = "Previous conversation:\n"
        for msg in context:
            role = "User" if msg["role"] == "user" else "NEXUS"
            formatted += f"{role}: {msg['content']}\n"
        
        return formatted
    
    def clear(self):
        """Clear session history"""
        self.messages = []
        if self.session_file.exists():
            self.session_file.unlink()


class UserProfile:
    """Manages user preferences and learned facts"""
    
    def __init__(self, user_id: str = "default"):
        self.user_id = user_id
        self.profile_file = MEMORY_DIR / f"user_{user_id}.json"
        self.data = self._load()
    
    def _load(self) -> dict:
        """Load user profile"""
        if self.profile_file.exists():
            try:
                return json.loads(self.profile_file.read_text())
            except:
                pass
        return {
            "user_id": self.user_id,
            "name": None,
            "preferences": {},
            "facts": [],  # Things learned about the user
            "created_at": datetime.utcnow().isoformat()
        }
    
    def _save(self):
        """Save user profile"""
        self.data["updated_at"] = datetime.utcnow().isoformat()
        self.profile_file.write_text(json.dumps(self.data, indent=2))
    
    def set_name(self, name: str):
        """Set user's name"""
        self.data["name"] = name
        self._save()
    
    def add_preference(self, key: str, value: str):
        """Add a user preference"""
        self.data["preferences"][key] = value
        self._save()
    
    def add_fact(self, fact: str):
        """Add a learned fact about the user"""
        if fact not in self.data["facts"]:
            self.data["facts"].append(fact)
            self._save()
    
    def get_context(self) -> str:
        """Format user profile for Gemini context"""
        parts = []
        
        if self.data.get("name"):
            parts.append(f"User's name: {self.data['name']}")
        
        if self.data.get("facts"):
            facts_str = "; ".join(self.data["facts"][-5:])  # Last 5 facts
            parts.append(f"Known about user: {facts_str}")
        
        if self.data.get("preferences"):
            prefs = ", ".join(f"{k}: {v}" for k, v in self.data["preferences"].items())
            parts.append(f"Preferences: {prefs}")
        
        return "\n".join(parts) if parts else ""


# ============ Memory Manager (Main Interface) ============

class MemoryManager:
    """Central manager for all memory operations"""
    
    def __init__(self, user_id: str = "default", session_id: str = None):
        self.user_id = user_id
        self.session_id = session_id or f"{user_id}_{datetime.now().strftime('%Y%m%d')}"
        
        self.conversation = ConversationMemory(self.session_id)
        self.profile = UserProfile(user_id)
    
    @tracer.wrap(service="nexus-memory", resource="add_exchange")
    def add_exchange(self, user_message: str, nexus_response: str):
        """Record a full exchange (user message + NEXUS response)"""
        self.conversation.add_message("user", user_message)
        self.conversation.add_message("nexus", nexus_response)
        
        # Extract facts from the exchange (simple heuristic)
        self._extract_facts(user_message)
    
    def _extract_facts(self, user_message: str):
        """Simple fact extraction from user messages"""
        msg_lower = user_message.lower()
        
        # Name detection
        if "my name is" in msg_lower or "i'm called" in msg_lower:
            # Simple extraction - in production use NER
            words = user_message.split()
            for i, word in enumerate(words):
                if word.lower() in ["is", "called", "i'm"]:
                    if i + 1 < len(words):
                        name = words[i + 1].strip(".,!?")
                        if name.isalpha() and len(name) > 1:
                            self.profile.set_name(name)
                            break
        
        # Interest detection
        if "i love" in msg_lower or "i like" in msg_lower or "i enjoy" in msg_lower:
            self.profile.add_fact(user_message[:100])
    
    @tracer.wrap(service="nexus-memory", resource="get_context")
    def get_full_context(self) -> str:
        """Get complete context for Gemini prompt"""
        parts = []
        
        # User profile context
        profile_ctx = self.profile.get_context()
        if profile_ctx:
            parts.append(f"[About the user]\n{profile_ctx}")
        
        # Conversation history
        conv_ctx = self.conversation.format_for_gemini(10)  # Last 10 messages
        if conv_ctx:
            parts.append(f"[Conversation history]\n{conv_ctx}")
        
        return "\n\n".join(parts)
    
    def get_user_name(self) -> Optional[str]:
        """Get user's name if known"""
        return self.profile.data.get("name")


# ============ Global Instance Factory ============

_memory_instances: dict[str, MemoryManager] = {}

def get_memory(user_id: str = "default", session_id: str = None) -> MemoryManager:
    """Get or create a memory manager for a user"""
    key = f"{user_id}:{session_id or 'default'}"
    if key not in _memory_instances:
        _memory_instances[key] = MemoryManager(user_id, session_id)
    return _memory_instances[key]
