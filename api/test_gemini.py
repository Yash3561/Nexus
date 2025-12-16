"""
Test script to check available Gemini models and API quota
Run: python test_gemini.py
"""

import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')

# Load .env file
load_dotenv()

# Configure with your API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("[ERROR] GOOGLE_API_KEY not found in .env file!")
    exit(1)

print(f"[OK] API Key found: {api_key[:10]}...{api_key[-4:]}")

genai.configure(api_key=api_key)

# List all available models
print("\n[INFO] Available Models:")
print("-" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"  - {model.name}")
        print(f"    Display: {model.display_name}")
        print(f"    Input limit: {model.input_token_limit:,} tokens")
        print(f"    Output limit: {model.output_token_limit:,} tokens")
        print()

# Test a simple generation
print("\n[TEST] Testing generation with gemini-1.5-flash...")
print("-" * 50)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Say 'Hello from NEXUS!' in a creative way")
    print(f"[OK] Success! Response:\n{response.text}")
except Exception as e:
    print(f"[ERROR] {e}")
    
    # Try alternative models
    print("\n[INFO] Trying alternative models...")
    alternatives = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro']
    
    for alt_model in alternatives:
        try:
            print(f"\nTrying {alt_model}...")
            model = genai.GenerativeModel(alt_model)
            response = model.generate_content("Say 'Hello from NEXUS!'")
            print(f"[OK] {alt_model} works! Response: {response.text[:100]}...")
            break
        except Exception as e2:
            print(f"[ERROR] {alt_model} failed: {str(e2)[:50]}...")
