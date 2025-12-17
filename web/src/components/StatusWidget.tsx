"use client";

import { useState, useEffect } from "react";

interface GaiaStatus {
    time: {
        formatted: string;
        time: string;
        date: string;
        day_of_week: string;
    };
    weather: {
        location: string;
        condition: string;
        temperature: string;
        feels_like: string;
        humidity: string;
        mock?: boolean;
    };
    location: string;
}

// Weather condition to emoji mapping
const weatherEmoji: { [key: string]: string } = {
    "Clear sky": "☀️",
    "Mainly clear": "🌤️",
    "Partly cloudy": "⛅",
    "Overcast": "☁️",
    "Foggy": "🌫️",
    "Light drizzle": "🌦️",
    "Moderate drizzle": "🌧️",
    "Dense drizzle": "🌧️",
    "Slight rain": "🌧️",
    "Moderate rain": "🌧️",
    "Heavy rain": "⛈️",
    "Slight snow": "🌨️",
    "Moderate snow": "❄️",
    "Heavy snow": "❄️",
    "Thunderstorm": "⛈️",
    "Unknown": "🌡️"
};

export default function StatusWidget() {
    const [status, setStatus] = useState<GaiaStatus | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/gaia/status");
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                    setError(false);
                }
            } catch {
                setError(true);
            }
        };

        fetchStatus();
        // Update every 60 seconds
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (error || !status) {
        return null; // Don't show widget if there's an error
    }

    const emoji = weatherEmoji[status.weather.condition] || "🌡️";

    return (
        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            {/* Weather */}
            <div className="flex items-center gap-2">
                <span className="text-xl">{emoji}</span>
                <div className="text-sm">
                    <span className="text-white font-medium">{status.weather.temperature}</span>
                    <span className="text-gray-400 ml-1">{status.weather.location}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* Time */}
            <div className="flex items-center gap-2">
                <span className="text-xl">🕐</span>
                <div className="text-sm">
                    <span className="text-white font-medium">{status.time.time}</span>
                    <span className="text-gray-400 ml-1">{status.time.day_of_week}</span>
                </div>
            </div>
        </div>
    );
}
