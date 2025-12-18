"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import VoiceInterface from "@/components/VoiceInterface";
import ChatDisplay from "@/components/ChatDisplay";
import MemoryPanel from "@/components/MemoryPanel";
import HivemindCounter from "@/components/HivemindCounter";
import HivemindStatusBar from "@/components/HivemindStatusBar";

// Dynamic import for Three.js globe (SSR-safe)
const EarthGlobe = dynamic(() => import("@/components/EarthGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface Message {
  role: "user" | "nexus";
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface ContextInsight {
  source: string;
  type: string;
  icon: string;
  data: Record<string, unknown>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [proactiveGreeting, setProactiveGreeting] = useState<string | null>(null);
  const [contextInsights, setContextInsights] = useState<ContextInsight[]>([]);

  // Check API connection and get proactive greeting on mount
  useEffect(() => {
    const init = async () => {
      try {
        await fetch("http://localhost:8000/health");
        setConnectionStatus("connected");

        // Get proactive greeting - NEXUS greets YOU first!
        const greetingRes = await fetch("http://localhost:8000/api/echo/greeting?user_id=demo-user");
        const greetingData = await greetingRes.json();
        setProactiveGreeting(greetingData.greeting);

        // Get context insights
        const insightsRes = await fetch("http://localhost:8000/api/echo/insights");
        const insightsData = await insightsRes.json();
        setContextInsights(insightsData.insights || []);
      } catch {
        setConnectionStatus("error");
      }
    };
    init();
  }, []);

  // Audio control
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback((base64Audio: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } catch {
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const handleVoiceInput = useCallback(async (text: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setIsProcessing(true);

    // Add empty NEXUS message that we'll stream into
    const nexusMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "nexus", content: "", timestamp: new Date() }]);

    try {
      // Use streaming endpoint for real-time text display
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
                // Update the NEXUS message in real-time
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated[nexusMessageIndex]) {
                    updated[nexusMessageIndex] = {
                      ...updated[nexusMessageIndex],
                      content: fullText
                    };
                  }
                  return updated;
                });
              }

              if (data.done) {
                // Streaming complete - now get audio
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
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[nexusMessageIndex]) {
          updated[nexusMessageIndex] = {
            ...updated[nexusMessageIndex],
            content: "Connection error. Is the API running?"
          };
        }
        return updated;
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages.length]);

  // Fetch audio separately after streaming completes
  const fetchAudio = useCallback(async (text: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/process-with-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: "demo-user", session_id: "demo-session" }),
      });
      const data = await response.json();
      if (data.audio) playAudio(data.audio);
    } catch (e) {
      console.error("Audio fetch error:", e);
    }
  }, [playAudio]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header with Memory Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#333]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8ab4f8] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1a1a1a]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <span className="text-lg font-medium text-white">NEXUS</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Memory Button - Shows what NEXUS knows */}
            <button
              onClick={() => setShowMemoryPanel(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] transition-colors text-sm"
            >
              <span>🧠</span>
              <span className="hidden sm:inline">Memory</span>
            </button>
            <div className={`flex items-center gap-1.5 text-xs ${connectionStatus === "connected" ? "text-green-400" : connectionStatus === "connecting" ? "text-yellow-400" : "text-red-400"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-green-400" : connectionStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
              {connectionStatus}
            </div>
          </div>
        </div>
      </header>

      {/* HIVEMIND Status Bar - Shows during chat */}
      {messages.length > 0 && (
        <div className="fixed top-[52px] left-0 right-0 z-40">
          <HivemindStatusBar />
        </div>
      )}

      {/* Main Content - Adjust padding based on whether status bar is showing */}
      <main className={`${messages.length > 0 ? "pt-24" : "pt-16"} pb-32 px-4`}>
        <div className="max-w-5xl mx-auto">
          {/* Welcome State with 3D Globe */}
          {messages.length === 0 && (
            <div className="flex flex-col lg:flex-row items-center justify-center min-h-[75vh] gap-8 lg:gap-12">
              {/* Left side - Globe */}
              <div className="w-full lg:w-1/2 h-[350px] lg:h-[450px] relative">
                <EarthGlobe showControls={true} />

                {/* HIVEMIND Counter overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl p-3 border border-[#333]">
                  <HivemindCounter />
                </div>
              </div>

              {/* Right side - Text and controls */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                {/* Proactive Greeting */}
                <h1 className="text-3xl lg:text-4xl font-light text-[#e8eaed] mb-4">
                  {proactiveGreeting || "Hello, I'm NEXUS"}
                </h1>
                <p className="text-[#9aa0a6] text-lg mb-6 max-w-md mx-auto lg:mx-0">
                  The consciousness layer of reality. Connected to
                  <span className="text-[#8ab4f8]"> real-time Earth data</span>, powered by
                  <span className="text-[#c9a7ff]"> collective intelligence</span>.
                </p>

                {/* Context Insight Cards */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                  {contextInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333] text-sm flex items-center gap-2"
                    >
                      <span>{insight.icon}</span>
                      <span className="text-[#9aa0a6]">{insight.source}</span>
                      {insight.source === "GAIA" && (
                        <span className="text-[#8ab4f8] text-xs">
                          {(insight.data as { weather?: string })?.weather || "Active"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Capability chips */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start text-sm">
                  <div className="px-3 py-1.5 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                    🧠 Persistent Memory
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                    🌍 Live GAIA Data
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                    🔗 HIVEMIND Network
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                    🔊 Voice-First
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ChatDisplay messages={messages} isProcessing={isProcessing} />
        </div>
      </main>

      {/* Voice Interface */}
      <VoiceInterface
        onTranscript={handleVoiceInput}
        isProcessing={isProcessing}
        isPlaying={isPlaying}
        onStopAudio={stopAudio}
      />

      {/* Memory Panel Modal */}
      <MemoryPanel isOpen={showMemoryPanel} onClose={() => setShowMemoryPanel(false)} />
    </div>
  );
}
