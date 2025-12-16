"use client";

interface Message {
    role: "user" | "nexus";
    content: string;
    timestamp: Date;
}

interface ChatDisplayProps {
    messages: Message[];
    isProcessing: boolean;
}

export default function ChatDisplay({
    messages,
    isProcessing,
}: ChatDisplayProps) {
    return (
        <div className="space-y-6">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                >
                    <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${message.role === "user"
                                ? "bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-400/30"
                                : "bg-white/5 border border-white/10"
                            }`}
                    >
                        {message.role === "nexus" && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                                    <span className="text-xs">🌐</span>
                                </div>
                                <span className="text-xs font-medium text-gray-400">NEXUS</span>
                            </div>
                        )}
                        <p className="text-gray-100 leading-relaxed">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            ))}

            {/* Processing indicator */}
            {isProcessing && (
                <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center animate-pulse">
                                <span className="text-xs">🌐</span>
                            </div>
                            <span className="text-xs font-medium text-gray-400">NEXUS</span>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                            <div
                                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                            />
                            <div
                                className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
