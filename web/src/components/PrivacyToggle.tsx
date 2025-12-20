"use client";

import { useState, useEffect } from "react";

type PrivacyMode = "private" | "anonymous" | "public";

interface PrivacyToggleProps {
    className?: string;
    onModeChange?: (mode: PrivacyMode) => void;
}

export default function PrivacyToggle({ className = "", onModeChange }: PrivacyToggleProps) {
    const [mode, setMode] = useState<PrivacyMode>("anonymous");
    const [isOpen, setIsOpen] = useState(false);

    const modes = [
        {
            value: "private" as PrivacyMode,
            icon: "🔒",
            label: "Private",
            description: "Solo mode - nothing shared",
            color: "text-red-400",
        },
        {
            value: "anonymous" as PrivacyMode,
            icon: "👤",
            label: "Anonymous",
            description: "Contribute anonymously",
            color: "text-yellow-400",
        },
        {
            value: "public" as PrivacyMode,
            icon: "🌐",
            label: "Public",
            description: "Full HIVEMIND participation",
            color: "text-green-400",
        },
    ];

    const currentMode = modes.find((m) => m.value === mode)!;

    const handleModeChange = (newMode: PrivacyMode) => {
        setMode(newMode);
        setIsOpen(false);
        onModeChange?.(newMode);
        // Save to localStorage
        localStorage.setItem("nexus-privacy-mode", newMode);
    };

    // Load saved mode
    useEffect(() => {
        const saved = localStorage.getItem("nexus-privacy-mode") as PrivacyMode;
        if (saved && ["private", "anonymous", "public"].includes(saved)) {
            setMode(saved);
        }
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] transition-colors text-sm"
            >
                <span>{currentMode.icon}</span>
                <span className={`hidden sm:inline ${currentMode.color}`}>{currentMode.label}</span>
                <svg
                    className={`w-3 h-3 text-[#666] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-[#252525] border border-[#444] rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#333]">
                            <p className="text-sm font-medium text-white">Privacy Mode</p>
                            <p className="text-xs text-[#888] mt-1">Control how you participate in HIVEMIND</p>
                        </div>

                        <div className="p-2">
                            {modes.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => handleModeChange(m.value)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${mode === m.value
                                            ? "bg-[#3d3d3d]"
                                            : "hover:bg-[#2d2d2d]"
                                        }`}
                                >
                                    <span className="text-xl">{m.icon}</span>
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${m.color}`}>{m.label}</p>
                                        <p className="text-xs text-[#888]">{m.description}</p>
                                    </div>
                                    {mode === m.value && (
                                        <svg className="w-4 h-4 text-green-400 ml-auto mt-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="px-4 py-3 border-t border-[#333] bg-[#1e1e1e]">
                            <p className="text-xs text-[#666]">
                                🔐 Your data is always encrypted. Only aggregated insights are shared.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
