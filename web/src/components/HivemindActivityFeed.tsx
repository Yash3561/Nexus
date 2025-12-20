"use client";

import { useState, useEffect } from "react";

interface Activity {
    id: number;
    location: string;
    topic: string;
    timeAgo: string;
    flag: string;
}

// Simulated global activity - makes HIVEMIND feel ALIVE
const LOCATIONS = [
    { city: "Tokyo", flag: "🇯🇵" },
    { city: "London", flag: "🇬🇧" },
    { city: "New York", flag: "🇺🇸" },
    { city: "Paris", flag: "🇫🇷" },
    { city: "Sydney", flag: "🇦🇺" },
    { city: "Berlin", flag: "🇩🇪" },
    { city: "Mumbai", flag: "🇮🇳" },
    { city: "São Paulo", flag: "🇧🇷" },
    { city: "Toronto", flag: "🇨🇦" },
    { city: "Singapore", flag: "🇸🇬" },
    { city: "Dubai", flag: "🇦🇪" },
    { city: "Seoul", flag: "🇰🇷" },
];

const TOPICS = [
    "climate change solutions",
    "AI ethics",
    "space exploration",
    "renewable energy",
    "quantum computing",
    "mental health",
    "cryptocurrency trends",
    "machine learning",
    "sustainable living",
    "future of work",
    "gene therapy",
    "autonomous vehicles",
    "blockchain applications",
    "healthcare innovation",
    "smart cities",
];

export default function HivemindActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    // Generate initial activities
    useEffect(() => {
        const initial: Activity[] = [];
        for (let i = 0; i < 3; i++) {
            initial.push(generateActivity(i));
        }
        setActivities(initial);
    }, []);

    // Add new activity every 5-8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActivities((prev) => {
                const newActivity = generateActivity(Date.now());
                const updated = [newActivity, ...prev.slice(0, 4)];
                return updated;
            });
        }, 5000 + Math.random() * 3000);

        return () => clearInterval(interval);
    }, []);

    function generateActivity(id: number): Activity {
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        const seconds = Math.floor(Math.random() * 30) + 1;

        return {
            id,
            location: location.city,
            flag: location.flag,
            topic,
            timeAgo: `${seconds}s ago`,
        };
    }

    if (!isVisible) return null;

    return (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-50" />
                    </div>
                    <span className="text-sm font-medium text-[#e8eaed]">HIVEMIND Live</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-[#666] hover:text-[#999] text-xs"
                >
                    Hide
                </button>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-[#2a2a2a]">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        className={`px-4 py-3 transition-all duration-500 ${index === 0 ? "bg-[#252525]" : ""
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-lg">{activity.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#e8eaed]">
                                    Someone in <span className="text-[#8ab4f8]">{activity.location}</span>{" "}
                                    is exploring{" "}
                                    <span className="text-[#c9a7ff]">{activity.topic}</span>
                                </p>
                                <p className="text-xs text-[#666] mt-1">{activity.timeAgo}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[#333] bg-[#1a1a1a]">
                <p className="text-xs text-[#666] text-center">
                    Join the global conversation • Your privacy is protected
                </p>
            </div>
        </div>
    );
}
