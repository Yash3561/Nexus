# ⚡ NEXUS: War Speed Execution Plan

**Created:** December 16, 2024  
**Timeline:** 15 Days to Submission  
**Philosophy:** Event-Driven Micro-Brain Architecture

---

## The Architecture That Won't Collapse

### Core Principle
> Everything is an event in Confluent Kafka. The "Brain" (Gemini) doesn't run the show—it **reacts to events**.

### The Nervous System (Kafka Topics)

```
┌─────────────────────────────────────────────────────────────┐
│                   CONFLUENT KAFKA TOPICS                    │
├─────────────────────────────────────────────────────────────┤
│  user-voice-input    │ Raw text from ElevenLabs STT        │
│  gaia-signals        │ Inbound data (weather/crypto/news)  │
│  nexus-thought       │ Internal AI reasoning chain         │
│  agent-response      │ Final text for ElevenLabs TTS       │
│  memory-events       │ ECHO memory updates                 │
│  observability       │ All events mirrored to Datadog      │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack (Hard Requirements)

| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | Next.js 14 (App Router) + Tailwind | Fastest to build, ElevenLabs React SDK |
| **Backend** | Python (FastAPI) | Native AI language, best for RAG/data |
| **Streaming** | Confluent Kafka (confluent-kafka lib) | Official client, not kafka-python |
| **AI** | Vertex AI + Gemini 2.0 | Google Cloud requirement |
| **Voice** | ElevenLabs Conversational AI | Partner requirement |
| **Monitoring** | Datadog (ddtrace) | Partner requirement |
| **State** | LangGraph or raw Python | Conversation memory management |

---

## Day-by-Day Targets

### Day 1 (Today): The Tracer Bullet 🎯

**Goal:** End-to-end loop connecting ALL 3 sponsors in one thread.

| # | Task | Success Criteria |
|---|------|------------------|
| 1 | Repo Setup | Monorepo with `/web` and `/api` folders |
| 2 | GCP Setup | Project created, Vertex AI enabled |
| 3 | Confluent Setup | Cluster created, `debug-stream` topic |
| 4 | Web UI | Next.js app with voice record button |
| 5 | Voice → Text | ElevenLabs STT working |
| 6 | Text → Kafka | Message published to `debug-stream` |
| 7 | Kafka → Python | FastAPI consumer receives message |
| 8 | Python → Gemini | Vertex AI generates response |
| 9 | Response → UI | Text displayed in browser |
| 10 | Datadog Trace | ddtrace logs function duration |

**The Loop:**
```
Voice → ElevenLabs STT → Confluent → Python → Gemini → UI
                                        ↓
                                    Datadog traces
```

---

### Day 2: Voice Round-Trip

| Task | Success Criteria |
|------|------------------|
| ElevenLabs TTS | Response spoken back to user |
| Streaming audio | Response streams as generated |
| Latency logging | Measure end-to-end time |
| Error handling | Graceful failures |

---

### Day 3: ECHO Foundation

| Task | Success Criteria |
|------|------------------|
| Database setup | Cloud Firestore or Spanner initialized |
| User identity | Basic user profile storage |
| Session memory | Last 10 turns persisted |
| Memory recall | "What did I say earlier?" works |

---

### Day 4: ECHO Personality

| Task | Success Criteria |
|------|------------------|
| Core identity layer | Permanent facts stored |
| Personality prompt | Echo has consistent voice |
| "Remember this" | User can mark important items |
| Session summary | End-of-session compression |

---

### Day 5: GAIA Data Streams

| Task | Success Criteria |
|------|------------------|
| Weather API | OpenWeatherMap → Kafka |
| Earthquake API | USGS → Kafka |
| News RSS | 2-3 feeds → Kafka |
| Flink/Consumer | Process and store streams |

---

### Day 6: GAIA Visualization

| Task | Success Criteria |
|------|------------------|
| 3D Earth globe | Three.js/React Three Fiber |
| Data overlays | Weather, earthquakes plotted |
| Real-time updates | New data appears live |
| Voice query | "Show me earthquakes" works |

---

### Day 7: PROMETHEUS Foundation

| Task | Success Criteria |
|------|------------------|
| Knowledge sources | arXiv API integration |
| Vector store | Vertex AI Matching Engine |
| Basic RAG | Query returns relevant papers |
| Citation format | Responses cite sources |

---

### Day 8: PROMETHEUS Synthesis

| Task | Success Criteria |
|------|------------------|
| Multi-doc query | Combine multiple sources |
| Confidence scores | Each claim rated |
| "I don't know" | Missing info acknowledged |
| TRACER integration | Verification pipeline |

---

### Day 9: OBSERVER Setup

| Task | Success Criteria |
|------|------------------|
| Datadog agent | Deployed and connected |
| LLM tracing | All Gemini calls traced |
| Custom metrics | Latency, tokens, errors |
| Basic dashboard | Visualize metrics |

---

### Day 10: OBSERVER Alerts

| Task | Success Criteria |
|------|------------------|
| Detection rules | High latency, errors |
| Hallucination metric | Track unverified claims |
| Memory health | Track retrieval quality |
| Alert → Action | Triggered alerts create cases |

---

### Day 11: Integration Testing

| Task | Success Criteria |
|------|------------------|
| Full flow test | Voice → All components → Voice |
| Load testing | 10 concurrent users |
| Error scenarios | Graceful degradation |
| Bug fixes | Critical issues resolved |

---

### Day 12: Demo Design

| Task | Success Criteria |
|------|------------------|
| 3 demo scripts | One per challenge track |
| Key moments | "Oh shit" moments planned |
| Test runs | Practice each demo |
| Polish UI | Make it beautiful |

---

### Day 13: Confluent Video

| Task | Success Criteria |
|------|------------------|
| Record demo | GAIA + real-time focus |
| Edit video | <3 minutes |
| Upload YouTube | Public, unlisted OK |
| Test playback | Quality check |

---

### Day 14: ElevenLabs + Datadog Videos

| Task | Success Criteria |
|------|------------------|
| Record ECHO demo | Voice + memory focus |
| Record OBSERVER demo | Dashboard + alerts focus |
| Edit both | <3 minutes each |
| Upload both | YouTube ready |

---

### Day 15: Final Polish

| Task | Success Criteria |
|------|------------------|
| Production deploy | Cloud Run stable |
| README complete | Setup instructions |
| LICENSE added | Open source visible |
| Final testing | Everything works |

---

### Day 16 (Dec 31): Submission

| Task | Success Criteria |
|------|------------------|
| Devpost form | All fields complete |
| Links verified | Hosted URL works |
| Videos linked | All 3 accessible |
| SUBMIT | Before 5pm EST |

---

## Project Structure

```
nexus/
├── web/                          # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx             # Main UI
│   │   ├── layout.tsx           # App layout
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── VoiceInterface.tsx   # ElevenLabs integration
│   │   ├── GaiaGlobe.tsx        # 3D Earth
│   │   └── ChatDisplay.tsx      # Conversation UI
│   ├── lib/
│   │   ├── kafka.ts             # Confluent client
│   │   └── elevenlabs.ts        # Voice helpers
│   ├── package.json
│   └── tailwind.config.js
│
├── api/                          # Python Backend
│   ├── main.py                  # FastAPI app
│   ├── consumers/
│   │   ├── voice_consumer.py    # Process voice input
│   │   └── gaia_consumer.py     # Process data streams
│   ├── services/
│   │   ├── gemini.py            # Vertex AI client
│   │   ├── memory.py            # ECHO memory
│   │   ├── tracer.py            # Verification system
│   │   └── prometheus.py        # Knowledge synthesis
│   ├── producers/
│   │   ├── weather.py           # Weather data
│   │   ├── news.py              # News feeds
│   │   └── earthquakes.py       # USGS data
│   ├── requirements.txt
│   └── Dockerfile
│
├── infra/                        # Infrastructure
│   ├── confluent/               # Kafka configs
│   ├── datadog/                 # Dashboard configs
│   └── gcp/                     # Terraform/configs
│
├── docs/                         # Documentation
│   ├── NEXUS_Vision_Document.md
│   ├── NEXUS_Technical_Limitations.md
│   ├── NEXUS_Master_Strategy.md
│   └── NEXUS_War_Speed_Execution.md
│
├── README.md
├── LICENSE                       # MIT or Apache 2.0
└── docker-compose.yml
```

---

## AI Coding Rules

### DO NOT Copy-Paste Blindly

| Wrong | Right |
|-------|-------|
| `kafka-python` | `confluent-kafka` (official) |
| Old Datadog agent | `ddtrace` |
| Deprecated APIs | Check SDK versions |

### Prompt for Architecture

❌ "Write a function to read Kafka"  
✅ "Write a robust, async Python consumer using confluent-kafka and FastAPI that maintains a persistent connection and handles rebalancing errors"

### The 200-Line Rule

- Keep files under 200 lines
- Modularize aggressively
- AI loses context on large files

---

## Day 1 Checklist (Do This NOW)

```
[ ] 1. Create GitHub repo: nexus-consciousness
[ ] 2. Initialize monorepo structure
[ ] 3. Create GCP project: nexus-hackathon
[ ] 4. Enable Vertex AI API
[ ] 5. Create Confluent Cloud cluster
[ ] 6. Create topic: debug-stream
[ ] 7. Initialize Next.js app in /web
[ ] 8. Initialize FastAPI app in /api
[ ] 9. Build voice record component
[ ] 10. Connect ElevenLabs STT
[ ] 11. Publish to Kafka topic
[ ] 12. Build Python consumer
[ ] 13. Connect to Gemini
[ ] 14. Return response to UI
[ ] 15. Add Datadog trace
[ ] 16. Test full loop
```

---

*"If you can't get the tracer bullet working in 24 hours, the full vision is dead."*
