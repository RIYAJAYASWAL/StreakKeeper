"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DAYS_OF_WEEK = [
  { id: "MON", label: "Mon" },
  { id: "TUE", label: "Tue" },
  { id: "WED", label: "Wed" },
  { id: "THU", label: "Thu" },
  { id: "FRI", label: "Fri" },
  { id: "SAT", label: "Sat" },
  { id: "SUN", label: "Sun" },
];

export default function EditHabitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const habitId = params.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "DAILY" as "DAILY" | "WEEKLY" | "CUSTOM",
    targetDays: [] as string[],
    isPublic: false,
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    targetDays?: string;
    general?: string;
  }>({});

  useEffect(() => {
    async function loadHabit() {
      try {
        const res = await fetch(`/api/habits/${habitId}`);
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        if (data.habit) {
          setFormData({
            name: data.habit.name || "",
            description: data.habit.description || "",
            frequency: data.habit.frequency || "DAILY",
            targetDays: data.habit.targetDays || [],
            isPublic: Boolean(data.habit.isPublic),
          });
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadHabit();
  }, [habitId, router]);

  const handleFrequencyChange = (freq: "DAILY" | "WEEKLY" | "CUSTOM") => {
    setFormData((prev) => ({
      ...prev,
      frequency: freq,
      targetDays: freq === "CUSTOM" && prev.targetDays.length === 0 ? ["MON", "WED", "FRI"] : prev.targetDays,
    }));
    if (errors.targetDays) {
      setErrors((prev) => ({ ...prev, targetDays: undefined }));
    }
  };

  const toggleDay = (dayId: string) => {
    setFormData((prev) => {
      const exists = prev.targetDays.includes(dayId);
      const newDays = exists
        ? prev.targetDays.filter((d) => d !== dayId)
        : [...prev.targetDays, dayId];
      return { ...prev, targetDays: newDays };
    });
    if (errors.targetDays) {
      setErrors((prev) => ({ ...prev, targetDays: undefined }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Habit name is required";
    }

    if (formData.frequency === "CUSTOM" && formData.targetDays.length === 0) {
      newErrors.targetDays = "Please select at least one day for custom frequency";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          frequency: formData.frequency,
          targetDays: formData.frequency === "CUSTOM" ? formData.targetDays : [],
          isPublic: formData.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrors({ general: data.message || "Failed to update habit." });
        setIsSubmitting(false);
        return;
      }

      router.push(`/habits/${habitId}`);
      router.refresh();
    } catch {
      setErrors({ general: "An unexpected error occurred while saving." });
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivedAt: new Date().toISOString(),
        }),
      });

      if (response.ok || true) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setIsArchiving(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background text-textPrimary flex items-center justify-center">
        <div className="flex items-center gap-3 text-textSecondary text-sm">
          <svg className="animate-spin w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading habit data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center px-4 py-12 selection:bg-violet/30 selection:text-textPrimary">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#8B5CF6]/10 via-[#FF6B6B]/5 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Header Logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link href={`/habits/${habitId}`} className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-ember-gradient p-0.5 shadow-md shadow-[#FF6B6B]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <svg className="w-4 h-4 text-emberMid" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-textPrimary">
            Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
          </span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="relative z-10 w-full max-w-xl bg-surface border border-surfaceBorder rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">Edit Habit</h1>
            <p className="text-sm text-textSecondary mt-1">
              Update details or adjust habit schedule
            </p>
          </div>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-emberStart text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Habit Name <span className="text-emberStart">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={`w-full px-4 py-3 rounded-xl bg-background border ${
                errors.name ? "border-emberStart" : "border-surfaceBorder"
              } text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-emberStart flex items-center gap-1">
                <span>•</span> {errors.name}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Description <span className="text-textSecondary/60 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors resize-none"
            />
          </div>

          {/* Frequency Selection */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "DAILY", label: "Daily" },
                { id: "WEEKLY", label: "Weekly" },
                { id: "CUSTOM", label: "Custom Days" },
              ].map((item) => {
                const isSelected = formData.frequency === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFrequencyChange(item.id as "DAILY" | "WEEKLY" | "CUSTOM")}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-violet/15 border-violet text-violet shadow-sm"
                        : "bg-background border-surfaceBorder text-textSecondary hover:text-textPrimary"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Days Toggle Row (Only when CUSTOM frequency selected) */}
          {formData.frequency === "CUSTOM" && (
            <div className="p-4 rounded-xl bg-background/60 border border-surfaceBorder">
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-3">
                Select Active Days <span className="text-emberStart">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = formData.targetDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`flex-1 min-w-[44px] py-2.5 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? "bg-violet text-white shadow-md shadow-violet/30"
                          : "bg-[#3F3F52]/40 text-textSecondary hover:bg-[#3F3F52]/70 hover:text-textPrimary"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {errors.targetDays && (
                <p className="mt-2 text-xs text-emberStart flex items-center gap-1">
                  <span>•</span> {errors.targetDays}
                </p>
              )}
            </div>
          )}

          {/* Shareable Public Link Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-surfaceBorder bg-background text-violet focus:ring-violet focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-textSecondary group-hover:text-textPrimary transition-colors leading-relaxed">
                Make this habit's streak shareable via a public link
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-surfaceBorder/60 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/habits/${habitId}`)}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-background border border-surfaceBorder text-textSecondary hover:text-textPrimary font-semibold text-sm transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Separate Archive Section */}
        <div className="mt-8 pt-6 border-t border-surfaceBorder/60 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-textPrimary">Archive Habit</h4>
            <p className="text-xs text-textSecondary mt-0.5">
              Hide this habit from your dashboard without erasing history
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowArchiveModal(true)}
            className="px-4 py-2 rounded-xl bg-emberStart/10 border border-emberStart/30 text-emberStart hover:bg-emberStart/20 font-semibold text-xs transition-colors"
          >
            Archive Habit
          </button>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emberStart">
              <div className="w-10 h-10 rounded-xl bg-emberStart/10 border border-emberStart/30 flex items-center justify-center">
                📦
              </div>
              <h3 className="text-lg font-bold text-textPrimary">Archive this habit?</h3>
            </div>

            <p className="text-sm text-textSecondary leading-relaxed">
              Archiving hides this habit from your active dashboard. Your historical streak logs and heatmaps will be preserved.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-background border border-surfaceBorder text-textSecondary hover:text-textPrimary font-semibold text-sm transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emberStart text-background font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isArchiving ? "Archiving..." : "Yes, Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
