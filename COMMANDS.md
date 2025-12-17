# NEXUS Development Commands

Quick reference for all commands needed to run NEXUS.

---

## 🚀 Quick Start

### Terminal 1: Start API Backend
```bash
cd api
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
API runs at: http://localhost:8000

### Terminal 2: Start Web Frontend
```bash
cd web
npm install
npm run dev
```
Web runs at: http://localhost:3000

---

## 📁 Project Structure

```
Nexus/
├── web/           # Next.js Frontend (port 3000)
├── api/           # FastAPI Backend (port 8000)
├── infra/         # Infrastructure configs
└── docs/          # Strategy documents
```

---

## 🔑 Environment Setup

### API (.env in /api folder)
```env
GOOGLE_API_KEY=your_gemini_api_key
CONFLUENT_BOOTSTRAP_SERVERS=your-cluster.confluent.cloud:9092
CONFLUENT_API_KEY=your_key
CONFLUENT_API_SECRET=your_secret
DD_API_KEY=your_datadog_key
```

### Get API Keys:
- Gemini: https://ai.google.dev
- Confluent: https://confluent.cloud
- Datadog: https://datadoghq.com
- ElevenLabs: https://elevenlabs.io

---

## 🧪 Testing Commands

### Test API Health
```bash
curl http://localhost:8000/health
```

### Test Gemini Connection
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/debug/gemini" -Method Post -ContentType "application/json" -Body '{"text": "hello"}'
```

### Test Full Pipeline
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/process" -Method Post -ContentType "application/json" -Body '{"text": "hello", "user_id": "test"}'
```

---

## 🔄 Git Commands

### Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/nexus.git
git push -u origin master
```

### Save Progress
```bash
git add .
git commit -m "Your commit message"
git push
```

---

## ⚠️ Known Issues

### Voice Recognition "network" Error
- **Cause:** Chrome requires HTTPS for microphone access
- **Solution:** Use text input on localhost, voice works in production (HTTPS)
- **Alternative:** Run with `ngrok` for HTTPS tunnel during development

### Gemini Rate Limits (429 Error)
- Switch models in `api/services/gemini.py`:
  - `gemini-2.5-flash` (recommended)
  - `gemini-2.5-pro` (higher quality)
  - `gemini-2.0-flash` (if quota allows)

---

## 📅 Development Timeline

| Day | Focus |
|-----|-------|
| 1 | ✅ Tracer Bullet (Gemini + API) |
| 2 | Voice Round-Trip (ElevenLabs) |
| 3-4 | ECHO Memory System |
| 5-6 | GAIA Data Streams |
| 7-8 | GAIA Visualization |
| 9-10 | PROMETHEUS Knowledge |
| 11-12 | OBSERVER (Datadog) |
| 13-15 | Demo Videos & Polish |
| 16 | Submit! |
