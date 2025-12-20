"use client";

interface Source {
    title: string;
    url?: string;
    domain?: string;
}

interface CitationCardsProps {
    sources: Source[];
    className?: string;
}

export default function CitationCards({ sources, className = "" }: CitationCardsProps) {
    if (!sources || sources.length === 0) return null;

    // Extract domain from URL
    const getDomain = (url?: string) => {
        if (!url) return "source";
        try {
            return new URL(url).hostname.replace("www.", "");
        } catch {
            return "source";
        }
    };

    // Get favicon
    const getFavicon = (url?: string) => {
        if (!url) return null;
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return null;
        }
    };

    return (
        <div className={`mt-3 ${className}`}>
            <p className="text-xs text-[#888] mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sources ({sources.length})
            </p>
            <div className="flex flex-wrap gap-2">
                {sources.slice(0, 4).map((source, i) => (
                    <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] hover:bg-[#333] border border-[#444] rounded-lg transition-colors group"
                    >
                        {source.url && (
                            <img
                                src={getFavicon(source.url) || ""}
                                alt=""
                                className="w-4 h-4 rounded"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        )}
                        <span className="text-xs text-[#8ab4f8] group-hover:underline truncate max-w-[150px]">
                            {source.domain || getDomain(source.url)}
                        </span>
                        <svg className="w-3 h-3 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
}

// Compact inline citations for messages
export function InlineCitation({ number, url }: { number: number; url?: string }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-4 h-4 text-[10px] bg-[#8ab4f8]/20 text-[#8ab4f8] rounded-full hover:bg-[#8ab4f8]/40 transition-colors cursor-pointer ml-0.5"
        >
            {number}
        </a>
    );
}
