"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

export interface CoachCardProps {
  habitId: string;
  initialSuggestion?: string | null;
}

export default function CoachCard({ habitId, initialSuggestion }: CoachCardProps) {
  const [suggestion, setSuggestion] = useState<string | null>(initialSuggestion || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSuggestion) {
      fetchSuggestion(false);
    }
  }, [habitId, initialSuggestion]);

  const fetchSuggestion = async (refresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, refresh }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch coach suggestion");
      }

      const data = await res.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion);
      }
    } catch {
      setError("Unable to generate suggestion at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0.5 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF9F1C] shadow-lg shadow-[#FF6B6B]/10">
      <div className="p-5 sm:p-6 rounded-[14px] bg-[#15151E] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF9F1C]/20 border border-[#FF6B6B]/40 flex items-center justify-center text-[#FF9F1C] shrink-0 font-bold text-lg">
            🧢
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FF9F1C]">
              Coach says...
            </div>
            {error ? (
              <p className="text-xs text-[#FF6B6B] mt-0.5">{error}</p>
            ) : suggestion ? (
              <p className="text-sm sm:text-base font-semibold text-textPrimary mt-0.5 leading-relaxed">
                {suggestion}
              </p>
            ) : (
              <p className="text-xs text-textSecondary mt-0.5 italic">
                {loading ? "Analyzing stats..." : "Loading suggestion..."}
              </p>
            )}
          </div>
        </div>

        {/* Refresh Icon Button */}
        <button
          type="button"
          onClick={() => fetchSuggestion(true)}
          disabled={loading}
          className="p-2 rounded-xl bg-[#0A0A0F]/60 border border-[#FF6B6B]/30 text-[#FF9F1C] hover:bg-[#FF6B6B]/10 hover:border-[#FF6B6B]/60 transition-all shrink-0 disabled:opacity-50"
          title="Refresh Coach Suggestion"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
