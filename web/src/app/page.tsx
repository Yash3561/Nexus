"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

  // Check API connection on mount - FIXED: using useEffect instead of useState
  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("error"));
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
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:8000/api/process-with-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: "demo-user", session_id: "demo-session" }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "nexus", content: data.text, timestamp: new Date() }]);
      if (data.audio) playAudio(data.audio);
    } catch {
      setMessages((prev) => [...prev, { role: "nexus", content: "Connection error. Is the API running?", timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  }, [playAudio]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Minimal Header */}
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
            <div className={`flex items-center gap-1.5 text-xs ${connectionStatus === "connected" ? "text-green-400" : connectionStatus === "connecting" ? "text-yellow-400" : "text-red-400"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-green-400" : connectionStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
              {connectionStatus}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-32 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#1a1a1a]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-normal text-[#e8eaed] mb-4">
                  Hello, I&apos;m NEXUS
                </h1>
                <p className="text-[#9aa0a6] text-lg max-w-lg mx-auto">
                  Your AI companion with memory. I remember our conversations,
                  access real-time data, and learn about you over time.
                </p>
              </div>

              {/* Capability chips */}
              <div className="flex flex-wrap gap-3 justify-center text-sm">
                <div className="px-4 py-2 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                  🧠 Remembers you
                </div>
                <div className="px-4 py-2 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                  🌍 Real-time data
                </div>
                <div className="px-4 py-2 rounded-full bg-[#2d2d2d] text-[#9aa0a6] border border-[#3c4043]">
                  🔊 Voice responses
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
    </div>
  );
}
