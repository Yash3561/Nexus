"use client";

import { useState, useEffect } from "react";

interface HivemindCounterProps {
    className?: string;
}

export default function HivemindCounter({ className = "" }: HivemindCounterProps) {
    const [count, setCount] = useState(4127);
    const [activity, setActivity] = useState("thinking about the future");

    // Simulated activities
    const activities = [
        "exploring climate data",
        "discussing AI ethics",
        "researching space exploration",
        "learning about history",
        "thinking about the future",
        "analyzing market trends",
        "studying science breakthroughs",
        "sharing knowledge",
    ];

    // Simulate fluctuating user count
    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => {
                const change = Math.floor(Math.random() * 20) - 8; // -8 to +12
                return Math.max(1000, Math.min(10000, prev + change));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Rotate through activities
    useEffect(() => {
        const interval = setInterval(() => {
            setActivity(activities[Math.floor(Math.random() * activities.length)]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Animated pulse indicator */}
            <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>

            {/* Counter text */}
            <div className="text-sm">
                <span className="text-green-400 font-medium">{count.toLocaleString()}</span>
                <span className="text-[#9aa0a6]"> minds connected</span>
                <span className="text-[#666] ml-2">· {activity}</span>
            </div>
        </div>
    );
}
