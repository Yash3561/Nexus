"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Brain, Globe2, Lock, Mic, Sparkles, Zap, StopCircle, ExternalLink, ChevronDown, Shield } from "lucide-react";

// SpeechRecognition types for TypeScript
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
}

// Dynamic import for Three.js globe (SSR-safe)
const EarthGlobe = dynamic(() => import("@/components/EarthGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface Source {
  title: string;
  url: string;
  domain: string;
}

interface Message {
  role: "user" | "nexus";
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface ContextInsight {
  source: string;
  type: string;
  icon: string;
  data: Record<string, unknown>;
}

// Privacy modes
type PrivacyMode = "private" | "anonymous" | "public";

// HIVEMIND Activity
interface Activity {
  id: number;
  location: string;
  topic: string;
  timeAgo: string;
}

const LOCATIONS = ["São Paulo", "New York", "Berlin", "Tokyo", "London", "Paris", "Dubai", "Mumbai", "Singapore", "Toronto"];
const TOPICS = ["AI ethics", "space exploration", "renewable energy", "blockchain", "quantum computing", "mental health", "climate solutions", "machine learning"];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [proactiveGreeting, setProactiveGreeting] = useState<string | null>(null);
  const [contextInsights, setContextInsights] = useState<ContextInsight[]>([]);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("anonymous");
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [hivemindCount, setHivemindCount] = useState(4127);
  const [hivemindActivity, setHivemindActivity] = useState("thinking together");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        await fetch("http://localhost:8000/health");
        setConnectionStatus("connected");

        // Get proactive greeting
        const greetingRes = await fetch("http://localhost:8000/api/echo/greeting");
        if (greetingRes.ok) {
          const data = await greetingRes.json();
          setProactiveGreeting(data.greeting);
        }

        // Get context insights
        const insightsRes = await fetch("http://localhost:8000/api/echo/insights");
        if (insightsRes.ok) {
          const data = await insightsRes.json();
          setContextInsights(data.insights || []);
        }
      } catch {
        setConnectionStatus("error");
      }
    };
    init();

    // Load saved privacy mode
    const saved = localStorage.getItem("nexus-privacy-mode") as PrivacyMode;
    if (saved && ["private", "anonymous", "public"].includes(saved)) {
      setPrivacyMode(saved);
    }

    // Initialize activities
    const initialActivities: Activity[] = [];
    for (let i = 0; i < 5; i++) {
      initialActivities.push({
        id: i,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
        timeAgo: `${Math.floor(Math.random() * 30) + 1}s ago`,
      });
    }
    setActivities(initialActivities);
  }, []);

  // Fluctuate HIVEMIND count
  useEffect(() => {
    const interval = setInterval(() => {
      setHivemindCount(prev => prev + Math.floor(Math.random() * 21) - 10);
      const activityTexts = ["thinking together", "exploring ideas", "sharing insights", "learning", "reasoning"];
      setHivemindActivity(activityTexts[Math.floor(Math.random() * activityTexts.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Add new activities
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [{
        id: Date.now(),
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
        timeAgo: "just now",
      }, ...prev.slice(0, 4)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            handleSubmit(finalTranscript);
            setIsListening(false);
          }
        };

        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
    return () => recognitionRef.current?.abort();
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handlePrivacyChange = (mode: PrivacyMode) => {
    setPrivacyMode(mode);
    localStorage.setItem("nexus-privacy-mode", mode);
    setShowPrivacyDropdown(false);
  };

  const fetchAudio = useCallback(async (text: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("TTS error:", error);
    }
  }, []);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setInputText("");
    setIsProcessing(true);

    // Add empty NEXUS message for streaming
    const nexusMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: "nexus", content: "", timestamp: new Date() }]);

    try {
      const response = await fetch("http://localhost:8000/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: "demo-user", session_id: "demo-session" }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullText += data.chunk;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[nexusMessageIndex]) {
                    updated[nexusMessageIndex] = { ...updated[nexusMessageIndex], content: fullText };
                  }
                  return updated;
                });
              }

              if (data.done) {
                if (data.sources && data.sources.length > 0) {
                  setMessages(prev => {
                    const updated = [...prev];
                    if (updated[nexusMessageIndex]) {
                      updated[nexusMessageIndex] = { ...updated[nexusMessageIndex], sources: data.sources };
                    }
                    return updated;
                  });
                }
                fetchAudio(data.full_text);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[nexusMessageIndex]) {
          updated[nexusMessageIndex] = { ...updated[nexusMessageIndex], content: "Connection error. Is the API running?" };
        }
        return updated;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const privacyModes = {
    private: { icon: Lock, label: "Private", color: "text-red-400" },
    anonymous: { icon: Lock, label: "Anonymous", color: "text-yellow-400" },
    public: { icon: Globe2, label: "Public", color: "text-green-400" },
  };

  const CurrentPrivacyIcon = privacyModes[privacyMode].icon;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff] flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#0a0a0a]" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">NEXUS</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Privacy Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-sm font-medium"
              >
                <CurrentPrivacyIcon className={`w-4 h-4 ${privacyModes[privacyMode].color}`} />
                <span className="hidden sm:inline">{privacyModes[privacyMode].label}</span>
                <ChevronDown className="w-3 h-3 text-[#9aa0a6]" />
              </button>

              {showPrivacyDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPrivacyDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    {(Object.keys(privacyModes) as PrivacyMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => handlePrivacyChange(mode)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 ${privacyMode === mode ? "bg-white/10" : ""}`}
                      >
                        {(() => {
                          const Icon = privacyModes[mode].icon;
                          return <Icon className={`w-4 h-4 ${privacyModes[mode].color}`} />;
                        })()}
                        <span className="text-sm">{privacyModes[mode].label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Memory Button */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-sm font-medium">
              <Brain className="w-4 h-4 text-pink-400" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-400 animate-pulse-glow" : "bg-red-400"}`} />
              <span className="text-xs font-medium text-green-400">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar - Chat mode only */}
      {messages.length > 0 && (
        <div className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2">
            <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="font-medium text-white">{hivemindCount.toLocaleString()} minds</span>
              <span>·</span>
              <span>{hivemindActivity}</span>
              <span>·</span>
              <Globe2 className="w-3 h-3" />
              <span>{contextInsights.find(i => i.source === "GAIA")?.data?.weather as string || "Loading..."}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${messages.length > 0 ? "pt-28" : "pt-16"}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="min-h-[calc(100vh-12rem)] flex flex-col">
              <div className="grid lg:grid-cols-2 gap-12 items-center flex-1">
                {/* Left: Globe */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full max-w-[400px] aspect-square">
                    <EarthGlobe showControls={true} />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong px-6 py-2 rounded-full whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow shrink-0" />
                      <span className="font-medium text-white">{hivemindCount.toLocaleString()} minds connected</span>
                      <span className="text-[#9aa0a6]">·</span>
                      <span className="text-[#9aa0a6] w-[120px] truncate">{hivemindActivity}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Content */}
                <div className="space-y-8 animate-slide-up">
                  <div className="space-y-4">
                    <h2 className="text-5xl lg:text-6xl font-bold tracking-tight text-white">
                      {proactiveGreeting?.split(",")[0] || "Good morning"}, <span className="text-[#4ade80]">Yash!</span>
                    </h2>
                    <h3 className="text-3xl lg:text-4xl font-medium text-[#9aa0a6]">
                      How can I help you today?
                    </h3>
                  </div>

                  <p className="text-lg text-[#9aa0a6] leading-relaxed">
                    The consciousness layer of reality. Connected to{" "}
                    <span className="text-[#8ab4f8] font-medium">real-time Earth data</span>, powered by{" "}
                    <span className="text-[#c9a7ff] font-medium">collective intelligence</span>.
                  </p>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-3">
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-[#8ab4f8]" />
                      <span className="text-sm font-medium">GAIA</span>
                      <span className="text-xs text-[#9aa0a6]">{contextInsights.find(i => i.source === "GAIA")?.data?.weather as string || "Loading..."}</span>
                    </div>
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#c9a7ff]" />
                      <span className="text-sm font-medium">ECHO</span>
                    </div>
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#4ade80]" />
                      <span className="text-sm font-medium">Persistent Memory</span>
                    </div>
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#8ab4f8]" />
                      <span className="text-sm font-medium">Live GAIA Data</span>
                    </div>
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#c9a7ff]" />
                      <span className="text-sm font-medium">HIVEMIND Network</span>
                    </div>
                    <div className="glass-strong px-4 py-2 rounded-full flex items-center gap-2">
                      <Mic className="w-4 h-4 text-[#4ade80]" />
                      <span className="text-sm font-medium">Voice-First</span>
                    </div>
                  </div>

                  {/* Input */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(inputText); }} className="glass-strong rounded-2xl p-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ask NEXUS anything..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[#9aa0a6] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => inputText.trim() ? handleSubmit(inputText) : handleMicClick()}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-primary transition-all ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-[#8ab4f8] hover:bg-[#8ab4f8]/90"}`}
                    >
                      <Mic className={`w-5 h-5 ${isListening ? "text-white" : "text-[#0a0a0a]"}`} />
                    </button>
                  </form>
                </div>
              </div>

              {/* HIVEMIND Feed */}
              {showActivityFeed && (
                <div className="mt-12 glass-strong rounded-2xl p-6 space-y-4 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
                      <h3 className="font-semibold text-white">HIVEMIND Live</h3>
                    </div>
                    <button onClick={() => setShowActivityFeed(false)} className="text-sm text-[#9aa0a6] hover:text-white transition-colors">Hide</button>
                  </div>

                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="w-10 h-10 rounded-lg bg-[#1e1e1e] flex items-center justify-center shrink-0 text-xs font-bold text-white">
                          {activity.location.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed text-white">
                            Someone in <span className="text-[#8ab4f8] font-medium">{activity.location}</span> is exploring{" "}
                            <span className="text-[#c9a7ff] font-medium">{activity.topic}</span>
                          </p>
                          <p className="text-xs text-[#9aa0a6] mt-0.5">{activity.timeAgo}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-sm text-[#9aa0a6]">
                    <Shield className="w-4 h-4" />
                    <span>Join the global conversation · Your privacy is protected</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-6 pb-32">
              {messages.map((message, index) => {
                if (message.role === "nexus" && !message.content.trim()) return null;

                return (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                    <div className={`flex items-start gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                      {message.role === "nexus" ? (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8ab4f8]/20 to-[#c9a7ff]/20 border border-[#8ab4f8]/30 flex items-center justify-center shrink-0 shadow-lg shadow-[#8ab4f8]/10">
                          <Brain className="w-5 h-5 text-[#8ab4f8]" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-white">Y</span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1">
                        <div className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${message.role === "user"
                          ? "bg-gradient-to-br from-[#8ab4f8] to-[#8ab4f8]/80 text-[#0a0a0a] shadow-lg shadow-[#8ab4f8]/20"
                          : "glass-strong shadow-md text-white"
                          }`}>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {/* Citations */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-1.5 pl-1">
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg glass hover:bg-white/5 transition-all group text-xs"
                              >
                                <span className="flex-1 text-[#9aa0a6] group-hover:text-white transition-colors">
                                  {source.title || source.domain}
                                </span>
                                <ExternalLink className="w-3 h-3 text-[#9aa0a6] group-hover:text-[#8ab4f8] transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}

                        <p className={`text-[11px] text-[#9aa0a6] px-2 ${message.role === "user" ? "text-right" : ""}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isProcessing && (
                <div className="flex justify-start animate-slide-up">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8ab4f8]/20 to-[#c9a7ff]/20 border border-[#8ab4f8]/30 flex items-center justify-center shadow-lg shadow-[#8ab4f8]/10">
                      <Brain className="w-5 h-5 text-[#8ab4f8]" />
                    </div>
                    <div className="glass-strong px-4 py-3 rounded-2xl shadow-md">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#8ab4f8]/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-[#8ab4f8]/70 animate-bounce" style={{ animationDelay: "200ms" }} />
                        <div className="w-2 h-2 rounded-full bg-[#8ab4f8]/70 animate-bounce" style={{ animationDelay: "400ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Bar - Chat mode */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(inputText); }} className="glass-strong rounded-2xl p-2 flex items-center gap-2 border border-white/5 shadow-xl">
              {isPlaying && (
                <button type="button" onClick={stopAudio} className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all">
                  <StopCircle className="w-5 h-5 text-white" />
                </button>
              )}
              <input
                type="text"
                placeholder="Ask NEXUS anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
                className="flex-1 bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-[#9aa0a6] text-white disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => {
                  if (isProcessing) return;
                  if (inputText.trim()) {
                    handleSubmit(inputText);
                  } else {
                    handleMicClick();
                  }
                }}
                disabled={isProcessing}
                className={`w-12 h-12 rounded-xl shrink-0 transition-all shadow-lg flex items-center justify-center ${isListening
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                  : "bg-[#8ab4f8] hover:bg-[#8ab4f8]/90 shadow-[#8ab4f8]/30"
                  } disabled:opacity-50`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mic className={`w-5 h-5 ${isListening ? "text-white" : "text-[#0a0a0a]"}`} />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
