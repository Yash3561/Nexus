"""
PROMETHEUS Service - Web Search & Knowledge Synthesis
Gives NEXUS the ability to search the web for accurate, real-time information.

Uses Tavily API - designed for AI agents, accurate web search
"""

import os
import httpx
from typing import Optional
from ddtrace import tracer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Tavily API
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

print(f"[PROMETHEUS] Tavily API Key: {'CONFIGURED' if TAVILY_API_KEY else 'NOT FOUND'}")


class PrometheusSearch:
    """Web search capability for NEXUS"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=15.0)
    
    @tracer.wrap(service="nexus-prometheus", resource="search")
    async def search(self, query: str, max_results: int = 5) -> dict:
        """Search the web for information using Tavily API"""
        print(f"[PROMETHEUS] Searching: {query}")
        
        if not TAVILY_API_KEY:
            print("[PROMETHEUS] No API key configured!")
            return {"query": query, "error": "No API key", "mock": True}
        
        try:
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "include_raw_content": False,
                "max_results": max_results
            }
            
            response = await self.client.post(url, json=payload)
            data = response.json()
            
            if response.status_code == 200:
                print(f"[PROMETHEUS] Got {len(data.get('results', []))} results")
                results = []
                for r in data.get("results", [])[:max_results]:
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("content", "")[:500]
                    })
                
                return {
                    "query": query,
                    "answer": data.get("answer"),
                    "results": results,
                    "mock": False
                }
            else:
                print(f"[PROMETHEUS] Tavily error: {data}")
                return {"query": query, "error": str(data), "mock": True}
                
        except Exception as e:
            print(f"[PROMETHEUS] Search error: {e}")
            return {"query": query, "error": str(e), "mock": True}
    
    def format_for_context(self, search_results: dict) -> str:
        """Format search results for Gemini context"""
        if search_results.get("mock") or search_results.get("error"):
            return ""
        
        parts = []
        
        # IMPORTANT: Prioritize actual source content over Tavily's answer
        # Tavily's answer field sometimes hallucinates (e.g., wrong president)
        # The actual search result titles/content from sources are more reliable
        
        parts.append("=== VERIFIED WEB SEARCH RESULTS ===")
        parts.append("Use the following SOURCE information to answer. Trust the sources, not summaries.")
        parts.append("")
        
        # Top sources - these are the actual facts
        for i, r in enumerate(search_results.get("results", [])[:5], 1):
            parts.append(f"SOURCE {i}: {r['title']}")
            parts.append(f"Content: {r['content'][:300]}")
            parts.append(f"URL: {r.get('url', 'N/A')}")
            parts.append("")
        
        parts.append("=== END SEARCH RESULTS ===")
        parts.append("IMPORTANT: Base your answer ONLY on the actual source content above.")
        
        return "\n".join(parts)
    
    async def close(self):
        await self.client.aclose()


# Global instance
_prometheus_instance: Optional[PrometheusSearch] = None

def get_prometheus() -> PrometheusSearch:
    global _prometheus_instance
    if _prometheus_instance is None:
        _prometheus_instance = PrometheusSearch()
    return _prometheus_instance


# ============ Smart Search Helper ============

def is_question(text: str) -> bool:
    """
    Detect if text is a question that might need factual info.
    Simple heuristic: questions end with ? or start with question words.
    """
    text_lower = text.lower().strip()
    
    # Ends with question mark
    if text.strip().endswith("?"):
        return True
    
    # Starts with question words
    question_starters = [
        "who", "what", "when", "where", "why", "how",
        "is", "are", "was", "were", "will", "can", "could",
        "do", "does", "did", "tell me", "give me", "show me"
    ]
    
    return any(text_lower.startswith(q) for q in question_starters)


async def search_if_needed(user_query: str) -> str:
    """
    Smart search: Search for ANY question that might need factual information.
    This is better than hardcoded keywords - if it looks like a question, search it!
    """
    
    # If it's a question, search for it
    if is_question(user_query):
        print(f"[PROMETHEUS] Question detected, searching: {user_query[:50]}...")
        prometheus = get_prometheus()
        results = await prometheus.search(user_query)
        return prometheus.format_for_context(results)
    
    print(f"[PROMETHEUS] Not a question, skipping search: {user_query[:30]}...")
    return ""


async def search_with_sources(user_query: str) -> tuple[str, list[dict]]:
    """
    Search and return both context string AND list of sources for citation display.
    Returns: (context_string, [{"title": ..., "url": ..., "domain": ...}, ...])
    """
    sources = []
    
    if is_question(user_query):
        print(f"[PROMETHEUS] Searching with sources: {user_query[:50]}...")
        prometheus = get_prometheus()
        results = await prometheus.search(user_query)
        
        # Extract sources for UI
        for r in results.get("results", [])[:4]:
            url = r.get("url", "")
            domain = ""
            if url:
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(url).netloc.replace("www.", "")
                except:
                    domain = url[:30]
            
            sources.append({
                "title": r.get("title", "")[:80],
                "url": url,
                "domain": domain
            })
        
        context = prometheus.format_for_context(results)
        return context, sources
    
    return "", sources

