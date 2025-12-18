"use client";

import { useState, useEffect } from "react";

interface Profile {
    name: string | null;
    facts: string[];
    preferences: Record<string, string>;
    stats: {
        total_conversations: number;
        messages_sent: number;
        first_seen: string | null;
        last_seen: string | null;
    };
}

interface MemoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8000/api/echo/profile?user_id=demo-user");
            const data = await res.json();
            setProfile(data);
        } catch (e) {
            console.error("Failed to fetch profile:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] w-full max-w-md mx-4 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#8ab4f8]/20 to-[#c9a7ff]/20 px-6 py-4 border-b border-[#333] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff] flex items-center justify-center">
                            <span className="text-xl">🧠</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-white">ECHO Memory</h2>
                            <p className="text-xs text-[#9aa0a6]">What I know about you</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-[#333] hover:bg-[#444] flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : profile ? (
                        <>
                            {/* User Identity */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-[#9aa0a6]">Identity</h3>
                                <div className="bg-[#252525] rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8ab4f8] to-[#c9a7ff] flex items-center justify-center text-xl">
                                            {profile.name ? profile.name[0].toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {profile.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-[#9aa0a6]">
                                                {profile.stats.total_conversations} conversations
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Learned Facts */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-[#9aa0a6]">
                                    What I&apos;ve Learned
                                </h3>
                                <div className="bg-[#252525] rounded-xl p-4">
                                    {profile.facts.length > 0 ? (
                                        <ul className="space-y-2">
                                            {profile.facts.map((fact, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[#e8eaed]">
                                                    <span className="text-[#8ab4f8]">•</span>
                                                    <span>{fact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-[#9aa0a6] italic">
                                            Tell me about yourself! I&apos;ll remember what you share.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Memory Stats */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-[#9aa0a6]">Memory Stats</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#252525] rounded-xl p-4 text-center">
                                        <p className="text-2xl font-light text-[#8ab4f8]">
                                            {profile.stats.messages_sent}
                                        </p>
                                        <p className="text-xs text-[#9aa0a6]">Messages</p>
                                    </div>
                                    <div className="bg-[#252525] rounded-xl p-4 text-center">
                                        <p className="text-2xl font-light text-[#c9a7ff]">
                                            {profile.facts.length}
                                        </p>
                                        <p className="text-xs text-[#9aa0a6]">Facts Learned</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transparency Note */}
                            <div className="bg-[#1a2a1a] border border-[#2a4a2a] rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">🔒</span>
                                    <div>
                                        <p className="text-sm font-medium text-green-400">Your data stays private</p>
                                        <p className="text-xs text-[#9aa0a6] mt-1">
                                            All memories are stored locally. You own your data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-[#9aa0a6] text-center py-8">Failed to load profile</p>
                    )}
                </div>
            </div>
        </div>
    );
}
