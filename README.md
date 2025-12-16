# 🌐 NEXUS: The Consciousness Layer of Reality

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> AI Partner Catalyst Hackathon Submission | December 2024

## What is NEXUS?

NEXUS is not just an application—it's **infrastructure for the next era of human-AI intelligence**.

- **ECHO** - Your persistent AI twin that remembers you forever
- **GAIA** - Real-time digital twin of Earth, fed by live data streams
- **PROMETHEUS** - Knowledge synthesis engine across all human research
- **OBSERVER** - Full observability of AI consciousness health

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Python FastAPI |
| AI | Google Vertex AI / Gemini 2.0 |
| Streaming | Confluent Cloud (Kafka) |
| Voice | ElevenLabs Conversational AI |
| Monitoring | Datadog LLM Observability |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Google Cloud account with Vertex AI enabled
- Confluent Cloud account
- ElevenLabs API key
- Datadog account

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nexus.git
cd nexus
```

### 2. Set up the API backend

```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload
```

### 3. Set up the web frontend

```bash
cd web
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### 4. Open in browser

Navigate to `http://localhost:3000` and start talking to NEXUS!

## Project Structure

```
nexus/
├── web/                  # Next.js Frontend
│   ├── src/app/         # App router pages
│   └── src/components/  # React components
├── api/                  # Python FastAPI Backend
│   ├── services/        # Gemini, Kafka services
│   └── main.py          # FastAPI app
├── infra/               # Infrastructure configs
└── docs/                # Documentation
```

## Hackathon Challenges

This project targets all three challenge tracks:

1. **Confluent Challenge** - Real-time data streaming with Kafka
2. **ElevenLabs Challenge** - Voice-driven AI interaction
3. **Datadog Challenge** - Full LLM observability

## Team

- Built with ❤️ for AI Partner Catalyst Hackathon

## License

MIT License - see [LICENSE](LICENSE) for details.
