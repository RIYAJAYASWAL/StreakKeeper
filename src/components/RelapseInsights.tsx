"use client";

import React from "react";
import { AlertTriangle, TrendingDown, ShieldCheck } from "lucide-react";
import { RelapsePattern, ConfidenceLevel } from "@/lib/relapseDetector";

export interface RelapseInsightsProps {
  patterns: RelapsePattern[];
  title?: string;
}

/**
 * Returns confidence badge styles based on level:
 * - High: Violet (#8B5CF6)
 * - Medium: Amber/Gold (#FF9F1C)
 * - Low: Muted Plum-Gray (#3F3F52)
 */
function getConfidenceBadge(confidence: ConfidenceLevel) {
  switch (confidence) {
    case "high":
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#8B5CF6] text-xs font-semibold tracking-wide uppercase">
          High Confidence
        </span>
      );
    case "medium":
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#FF9F1C]/15 border border-[#FF9F1C]/40 text-[#FF9F1C] text-xs font-semibold tracking-wide uppercase">
          Medium Confidence
        </span>
      );
    case "low":
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#3F3F52]/40 border border-[#3F3F52] text-[#9494A8] text-xs font-medium tracking-wide uppercase">
          Low Confidence
        </span>
      );
  }
}

export default function RelapseInsights({
  patterns = [],
  title = "Relapse Pattern Insights",
}: RelapseInsightsProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 flex items-center justify-center text-[#5EEAD4] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#F4F4F8]">No relapse patterns detected</h4>
          <p className="text-xs text-[#9494A8] mt-0.5">
            Your habit logs show consistent execution without recurring drop-off triggers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-base font-bold text-[#F4F4F8] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF9F1C]" />
          <span>{title}</span>
        </h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pattern, idx) => {
          const IconComponent =
            pattern.type === "streak_length" ? TrendingDown : AlertTriangle;

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex flex-col justify-between hover:border-[#383852] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 flex items-center justify-center text-[#FF6B6B] shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                {getConfidenceBadge(pattern.confidence)}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#F4F4F8] leading-snug">
                  {pattern.description}
                </p>
                <p className="text-xs text-[#9494A8] mt-1">
                  Type: <strong className="font-mono text-[#F4F4F8]">{pattern.type}</strong>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
