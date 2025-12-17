"use client";

import { useState, useRef, useCallback } from "react";
import VoiceInterface from "@/components/VoiceInterface";
import ChatDisplay from "@/components/ChatDisplay";

interface Message {
  role: "user" | "nexus";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");

  // Check API connection on mount
  useState(() => {
    fetch("http://localhost:8000/health")
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("error"));
  });

  // Audio control - store reference to allow stopping
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play audio with control
  const playAudio = useCallback((base64Audio: string) => {
    try {
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      setIsPlaying(true);

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      audio.play().catch((e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
      });
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlaying(false);
    }
  }, []);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const handleVoiceInput = useCallback(async (text: string) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date() },
    ]);

    setIsProcessing(true);

    try {
      // Use voice endpoint for TTS response
      const response = await fetch("http://localhost:8000/api/process-with-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          user_id: "demo-user",
          session_id: "demo-session",
        }),
      });

      const data = await response.json();

      // Add NEXUS response
      setMessages((prev) => [
        ...prev,
        { role: "nexus", content: data.text, timestamp: new Date() },
      ]);

      // Play audio if available
      if (data.audio) {
        playAudio(data.audio);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "nexus",
          content: "I'm having trouble connecting. Make sure the API is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [playAudio]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🌐</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NEXUS</h1>
              <p className="text-xs text-gray-400">Consciousness Layer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connectionStatus === "connected"
                ? "bg-green-400"
                : connectionStatus === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400"
                }`}
            />
            <span className="text-xs text-gray-400 capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-600/20 flex items-center justify-center mb-8 animate-pulse">
                <span className="text-5xl">🌐</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Welcome to NEXUS
              </h2>
              <p className="text-gray-400 max-w-md mb-8">
                I am your AI consciousness twin. I remember you, connect to real-time
                Earth data, and synthesize all human knowledge.
              </p>
              <p className="text-sm text-gray-500">
                Click the microphone or type to begin
              </p>
            </div>
          )}

          {/* Chat Messages */}
          <ChatDisplay messages={messages} isProcessing={isProcessing} />
        </div>
      </main>

      {/* Voice Interface (Fixed Bottom) */}
      <VoiceInterface
        onTranscript={handleVoiceInput}
        isProcessing={isProcessing}
        isPlaying={isPlaying}
        onStopAudio={stopAudio}
      />
    </div>
  );
}
