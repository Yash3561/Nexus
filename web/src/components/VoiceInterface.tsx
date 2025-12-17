"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item: (index: number) => SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface VoiceInterfaceProps {
    onTranscript: (text: string) => void;
    isProcessing: boolean;
    isPlaying?: boolean;
    onStopAudio?: () => void;
}

export default function VoiceInterface({ onTranscript, isProcessing, isPlaying = false, onStopAudio }: VoiceInterfaceProps) {
    const [isListening, setIsListening] = useState(false);
    const [inputText, setInputText] = useState("");
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const handleResult = useCallback((event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            setTranscript(finalTranscript);
            onTranscript(finalTranscript);
            setIsListening(false);
        }
    }, [onTranscript]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US";
                recognitionRef.current.onresult = handleResult;
                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
        return () => recognitionRef.current?.abort();
    }, [handleResult]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            recognitionRef.current.start();
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
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] px-4 py-4">
            <div className="max-w-3xl mx-auto">
                {/* Transcript preview */}
                {transcript && isListening && (
                    <div className="text-center text-[#9aa0a6] text-sm mb-3">{transcript}</div>
                )}

                <div className="flex items-center gap-3">
                    {/* Stop audio button */}
                    {isPlaying && onStopAudio && (
                        <button
                            onClick={onStopAudio}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#ea4335] hover:bg-[#d33828] transition-colors"
                            title="Stop audio"
                        >
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" rx="1" />
                            </svg>
                        </button>
                    )}

                    {/* Input field */}
                    <form onSubmit={handleTextSubmit} className="flex-1">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Ask NEXUS anything..."
                            disabled={isProcessing}
                            className="w-full px-4 py-3 bg-[#2d2d2d] border border-[#3c4043] rounded-full text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8] transition-colors disabled:opacity-50"
                        />
                    </form>

                    {/* Mic button */}
                    <button
                        onClick={toggleListening}
                        disabled={isProcessing || isPlaying}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening
                                ? "bg-[#ea4335] scale-110"
                                : isProcessing || isPlaying
                                    ? "bg-[#3c4043] cursor-not-allowed"
                                    : "bg-[#8ab4f8] hover:bg-[#aecbfa]"
                            }`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        ) : (
                            <svg className={`w-5 h-5 ${isListening ? "text-white" : "text-[#1a1a1a]"}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}