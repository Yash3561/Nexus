"use client";

import { useState, useRef, useEffect } from "react";

// Web Speech API TypeScript declarations
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface VoiceInterfaceProps {
    onTranscript: (text: string) => void;
    isProcessing: boolean;
}

export default function VoiceInterface({
    onTranscript,
    isProcessing,
}: VoiceInterfaceProps) {
    const [isListening, setIsListening] = useState(false);
    const [inputText, setInputText] = useState("");
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        // Initialize Web Speech API
        if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    onTranscript(finalTranscript);
                    setIsListening(false);
                    recognitionRef.current?.stop();
                } else {
                    setTranscript(interimTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            recognitionRef.current?.stop();
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !isProcessing) {
            onTranscript(inputText.trim());
            setInputText("");
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-6 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Transcript Display */}
                {transcript && isListening && (
                    <div className="mb-4 text-center">
                        <p className="text-gray-400 text-sm animate-pulse">{transcript}</p>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-center gap-4">
                    {/* Text Input */}
                    <form onSubmit={handleTextSubmit} className="flex-1">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isProcessing || isListening}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all disabled:opacity-50"
                        />
                    </form>

                    {/* Voice Button */}
                    <button
                        onClick={toggleListening}
                        disabled={isProcessing}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                            ? "bg-red-500 scale-110 shadow-lg shadow-red-500/50"
                            : isProcessing
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-br from-cyan-500 to-purple-600 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                            }`}
                    >
                        {isProcessing ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isListening ? (
                            <svg
                                className="w-7 h-7 text-white animate-pulse"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <rect x="6" y="4" width="4" height="16" rx="2" />
                                <rect x="14" y="4" width="4" height="16" rx="2" />
                            </svg>
                        ) : (
                            <svg
                                className="w-7 h-7 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Powered by */}
                <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
                    <span>Powered by</span>
                    <span className="text-cyan-400">Gemini</span>
                    <span>•</span>
                    <span className="text-purple-400">ElevenLabs</span>
                    <span>•</span>
                    <span className="text-green-400">Confluent</span>
                    <span>•</span>
                    <span className="text-yellow-400">Datadog</span>
                </div>
            </div>
        </div>
    );
}
