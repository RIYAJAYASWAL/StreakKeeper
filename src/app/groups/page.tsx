"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface HabitGroupItem {
  id: string;
  name: string;
  color: string;
  _count?: {
    habits: number;
  };
}

const PRESET_COLORS = [
  { name: "Coral", hex: "#FF6B6B" },
  { name: "Gold", hex: "#FF9F1C" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Cyan", hex: "#5EEAD4" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Amber", hex: "#F59E0B" },
];

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<HabitGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Group Form State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Group name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingGroupId) {
        // Update existing group
        const res = await fetch(`/api/groups/${editingGroupId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), color: selectedColor }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update group");
        }
      } else {
        // Create new group
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), color: selectedColor }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create group");
        }
      }

      setName("");
      setSelectedColor(PRESET_COLORS[0].hex);
      setEditingGroupId(null);
      await fetchGroups();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (group: HabitGroupItem) => {
    setEditingGroupId(group.id);
    setName(group.name);
    setSelectedColor(group.color);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setName("");
    setSelectedColor(PRESET_COLORS[0].hex);
    setErrorMsg(null);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? Habits in this group will become ungrouped.")) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (editingGroupId === groupId) {
          handleCancelEdit();
        }
        await fetchGroups();
      }
    } catch {
      // Graceful fallback
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col selection:bg-violet/30 selection:text-textPrimary">
      {/* Header */}
      <header className="w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-textSecondary hover:text-textPrimary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold text-textPrimary">
              Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-textPrimary">
            Habit Groups
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Organize your habits into custom color-coded categories.
          </p>
        </div>

        {/* Group Form Card */}
        <div className="p-6 rounded-2xl bg-[#15151E] border border-[#232336] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F4F4F8]">
              {editingGroupId ? "Edit Group" : "Create New Group"}
            </h2>
            {editingGroupId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-[#9494A8] hover:text-[#F4F4F8] transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveGroup} className="space-y-5">
            {/* Name Input */}
            <div>
              <label htmlFor="groupName" className="block text-xs font-semibold text-[#9494A8] uppercase tracking-wider mb-2">
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Health & Fitness, Career, Mindset"
                className="w-full px-4 py-3 rounded-xl bg-background border border-[#232336] text-[#F4F4F8] text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
            </div>

            {/* Preset Color Palette Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#9494A8] uppercase tracking-wider mb-2">
                Select Group Color
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? "ring-2 ring-white scale-110 shadow-lg"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingGroupId
                  ? "Update Group"
                  : "Create Group"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Groups List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-textPrimary">Your Groups</h2>

          {loading ? (
            <p className="text-xs text-textSecondary">Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#15151E] border border-[#232336] text-center text-sm text-[#9494A8]">
              No custom groups created yet. Create one above to organize your dashboard!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] flex items-center justify-between gap-4 shadow-sm hover:border-[#383852] transition-all"
                  style={{ borderLeft: `4px solid ${group.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <h3 className="font-bold text-[#F4F4F8] text-base">{group.name}</h3>
                      <p className="text-xs text-[#9494A8] mt-0.5">
                        {group._count?.habits ?? 0} habit{group._count?.habits !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(group)}
                      className="px-3 py-1.5 rounded-lg bg-[#232336] hover:bg-[#383852] text-xs font-semibold text-[#F4F4F8] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-xs font-semibold text-[#FF6B6B] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
