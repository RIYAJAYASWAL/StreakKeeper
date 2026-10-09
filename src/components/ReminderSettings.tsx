"use client";

import React, { useState, useEffect } from "react";
import { Bell, Clock, Plus, Trash2, Check, Sparkles } from "lucide-react";
import { ensurePushSubscription } from "@/lib/pushSubscription";

export interface ReminderItem {
  id: string;
  habitId: string;
  time: string; // "HH:MM"
  daysOfWeek: string[];
  enabled: boolean;
  lastSentAt?: string | null;
}

export interface ReminderSettingsProps {
  habitId: string;
  initialReminders?: ReminderItem[];
  suggestedTime?: string | null;
}

const ALL_DAYS = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

/**
 * Helper to convert 24hr "HH:MM" to 12hr display format (e.g. "08:30" -> "8:30 AM")
 */
function formatTime12Hr(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

export default function ReminderSettings({
  habitId,
  initialReminders = [],
  suggestedTime = null,
}: ReminderSettingsProps) {
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);
  const [loading, setLoading] = useState(false);

  // New Reminder Form State
  const [time, setTime] = useState(suggestedTime || "08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch latest reminders on mount if not provided
  useEffect(() => {
    if (initialReminders.length === 0) {
      setLoading(true);
      fetch(`/api/habits/${habitId}/reminders`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setReminders(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [habitId, initialReminders]);

  // Toggle Day Selection in Form
  const toggleDay = (dayCode: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayCode)
        ? prev.filter((d) => d !== dayCode)
        : [...prev, dayCode]
    );
  };

  // Add Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedDays.length === 0) {
      setErrorMsg("Please select at least one day of the week.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ensurePushSubscription();

      const res = await fetch(`/api/habits/${habitId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time,
          daysOfWeek: selectedDays,
          enabled: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add reminder");
      }

      const newReminder = await res.json();
      setReminders((prev) => [newReminder, ...prev]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save reminder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Reminder Enabled Status
  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !currentStatus } : r))
    );

    try {
      await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
    } catch {
      // Revert if error
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: currentStatus } : r))
      );
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });
    } catch {
      // Refresh list if failed
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#15151E] border border-[#232336] shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F4F4F8]">Habit Reminders</h3>
            <p className="text-xs text-[#9494A8]">
              Schedule daily or custom day notifications to maintain your streak momentum.
            </p>
          </div>
        </div>
      </div>

      {/* Personalization Suggestion Banner */}
      {suggestedTime && (
        <div className="p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#F4F4F8]">
            <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span>
              Suggested based on your history:{" "}
              <strong className="text-[#8B5CF6] font-bold">
                {formatTime12Hr(suggestedTime)}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTime(suggestedTime)}
            className="px-3 py-1 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            Apply Time
          </button>
        </div>
      )}

      {/* Add Reminder Form */}
      <form onSubmit={handleAddReminder} className="p-4 rounded-xl bg-[#0A0A0F]/60 border border-[#232336] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#9494A8] mb-1.5 uppercase tracking-wider">
              Reminder Time (24h)
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#15151E] border border-[#232336] text-[#F4F4F8] text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                required
              />
              <Clock className="w-4 h-4 text-[#9494A8] absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-sm shadow-md shadow-[#8B5CF6]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Add Reminder"}</span>
            </button>
          </div>
        </div>

        {/* Day Toggles (Violet #8B5CF6 for selected states) */}
        <div>
          <label className="block text-xs font-semibold text-[#9494A8] mb-2 uppercase tracking-wider">
            Applies To Days
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.code);
              return (
                <button
                  key={day.code}
                  type="button"
                  onClick={() => toggleDay(day.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm"
                      : "bg-[#15151E] text-[#9494A8] border-[#232336] hover:border-[#383852] hover:text-[#F4F4F8]"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && <p className="text-xs text-[#FF6B6B]">{errorMsg}</p>}
      </form>

      {/* Reminders List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-[#9494A8] uppercase tracking-wider">
          Active Reminders ({reminders.length})
        </h4>

        {loading ? (
          <p className="text-xs text-[#9494A8]">Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#0A0A0F]/40 border border-[#232336] text-center text-xs text-[#9494A8]">
            No active reminders scheduled for this habit.
          </div>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  reminder.enabled
                    ? "bg-[#0A0A0F]/80 border-[#232336]"
                    : "bg-[#0A0A0F]/30 border-[#232336]/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                      reminder.enabled
                        ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                        : "bg-[#232336] text-[#9494A8]"
                    }`}
                  >
                    ⏰
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#F4F4F8]">
                        {formatTime12Hr(reminder.time)}
                      </span>
                      <span className="text-[10px] font-mono text-[#9494A8]">
                        ({reminder.time})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {ALL_DAYS.map((d) => {
                        const isDayActive = reminder.daysOfWeek.includes(d.code);
                        return (
                          <span
                            key={d.code}
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isDayActive
                                ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                                : "text-[#3F3F52]"
                            }`}
                          >
                            {d.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Enable/Disable Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(reminder.id, reminder.enabled)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      reminder.enabled
                        ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/30"
                        : "bg-[#232336] text-[#9494A8] border-[#232336] hover:text-[#F4F4F8]"
                    }`}
                  >
                    {reminder.enabled ? "Active" : "Disabled"}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1.5 rounded-lg text-[#9494A8] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
