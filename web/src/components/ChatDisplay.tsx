"use client";

import { useEffect, useRef } from "react";
import CitationCards from "./CitationCards";

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

interface ChatDisplayProps {
    messages: Message[];
    isProcessing: boolean;
}

export default function ChatDisplay({ messages, isProcessing }: ChatDisplayProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="space-y-6 py-4">
            {messages.map((message, index) => {
                // Skip rendering empty NEXUS messages - thinking dots will show instead
                if (message.role === "nexus" && !message.content.trim()) {
                    return null;
                }

                return (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === "user"
                                ? "bg-[#8ab4f8]"
                                : "bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff]"
                                }`}>
                                {message.role === "user" ? (
                                    <svg className="w-4 h-4 text-[#1a1a1a]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-[#1a1a1a]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                )}
                            </div>

                            {/* Message */}
                            <div className="flex flex-col">
                                <div className={`rounded-2xl px-4 py-3 ${message.role === "user"
                                    ? "bg-[#8ab4f8] text-[#1a1a1a]"
                                    : "bg-[#2d2d2d] text-[#e8eaed]"
                                    }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-2 ${message.role === "user" ? "text-[#1a1a1a]/60" : "text-[#9aa0a6]"}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Citation Cards - Show sources for NEXUS messages */}
                                {message.role === "nexus" && message.sources && message.sources.length > 0 && (
                                    <CitationCards sources={message.sources} />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Thinking indicator */}
            {isProcessing && (
                <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff]">
                            <svg className="w-4 h-4 text-[#1a1a1a]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                        </div>
                        <div className="bg-[#2d2d2d] rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
