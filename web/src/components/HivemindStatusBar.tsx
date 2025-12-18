"use client";

import { useState, useEffect } from "react";

interface HivemindStatusBarProps {
    className?: string;
}

export default function HivemindStatusBar({ className = "" }: HivemindStatusBarProps) {
    const [count, setCount] = useState(4127);
    const [activity, setActivity] = useState("thinking together");
    const [weather, setWeather] = useState<string | null>(null);

    const activities = [
        "exploring ideas",
        "discussing AI",
        "learning together",
        "sharing knowledge",
        "thinking together",
        "researching topics",
    ];

    // Fluctuating count
    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => {
                const change = Math.floor(Math.random() * 15) - 5;
                return Math.max(1000, Math.min(10000, prev + change));
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Rotate activities
    useEffect(() => {
        const interval = setInterval(() => {
            setActivity(activities[Math.floor(Math.random() * activities.length)]);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch weather once
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/gaia/status");
                const data = await res.json();
                if (data.weather?.temperature) {
                    setWeather(`${data.weather.temperature}, ${data.weather.condition}`);
                }
            } catch {
                // Silently fail
            }
        };
        fetchWeather();
    }, []);

    return (
        <div className={`bg-[#1e1e1e]/90 backdrop-blur-sm border-b border-[#2a2a2a] ${className}`}>
            <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
                {/* Left - HIVEMIND status */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-50" />
                        </div>
                        <span className="text-green-400 font-medium">{count.toLocaleString()}</span>
                        <span className="text-[#666]">minds</span>
                    </div>
                    <span className="text-[#555]">·</span>
                    <span className="text-[#888]">{activity}</span>
                </div>

                {/* Right - GAIA status */}
                {weather && (
                    <div className="flex items-center gap-2 text-[#888]">
                        <span>🌍</span>
                        <span>{weather}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
