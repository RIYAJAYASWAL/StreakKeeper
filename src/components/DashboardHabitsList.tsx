"use client";

import React, { useState } from "react";
import HabitCard from "@/components/HabitCard";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

export interface DashboardHabitItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  frequency: string;
  isNumeric?: boolean;
  unit?: string | null;
  freezesAvailable: number;
  currentStreak: number;
  todayStatus: "DONE" | "MISSED" | "FROZEN" | "PENDING" | null;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface HabitGroupData {
  id: string;
  name: string;
  color: string;
}

export interface DashboardHabitsListProps {
  habits: DashboardHabitItem[];
  groups: HabitGroupData[];
}

export default function DashboardHabitsList({ habits, groups }: DashboardHabitsListProps) {
  // Collapsible sections state (open by default for all groups)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupIdKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupIdKey]: !prev[groupIdKey],
    }));
  };

  // Group habits by group ID
  const habitsByGroup = new Map<string, DashboardHabitItem[]>();
  const ungroupedHabits: DashboardHabitItem[] = [];

  habits.forEach((habit) => {
    if (habit.group?.id || habit.groupId) {
      const gId = habit.group?.id || habit.groupId!;
      if (!habitsByGroup.has(gId)) {
        habitsByGroup.set(gId, []);
      }
      habitsByGroup.get(gId)!.push(habit);
    } else {
      ungroupedHabits.push(habit);
    }
  });

  // Build section list: custom groups that have habits or all user groups
  const sectionsToRender: Array<{
    id: string;
    name: string;
    color: string;
    items: DashboardHabitItem[];
  }> = [];

  // 1. Add registered groups first (if they have habits)
  groups.forEach((g) => {
    const items = habitsByGroup.get(g.id) || [];
    if (items.length > 0) {
      sectionsToRender.push({
        id: g.id,
        name: g.name,
        color: g.color,
        items,
      });
      habitsByGroup.delete(g.id);
    }
  });

  // 2. Add any remaining group IDs (if habit linked to group not in groups array)
  habitsByGroup.forEach((items, gId) => {
    const groupInfo = items[0]?.group;
    sectionsToRender.push({
      id: gId,
      name: groupInfo?.name || "Grouped Habits",
      color: groupInfo?.color || "#FF6B6B",
      items,
    });
  });

  // 3. Add Ungrouped / Other section
  if (ungroupedHabits.length > 0) {
    sectionsToRender.push({
      id: "other",
      name: "Other",
      color: "#9494A8",
      items: ungroupedHabits,
    });
  }

  // If no groups exist and only ungrouped habits exist, show simple grid without extra header noise
  if (groups.length === 0 && sectionsToRender.length === 1 && sectionsToRender[0].id === "other") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {habits.map((habit) => {
          const cleanId = habit.id.includes("/") ? habit.id.split("/").filter(Boolean).pop()! : habit.id;
          return (
            <HabitCard
              key={cleanId}
              id={cleanId}
              habitId={cleanId}
              slug={habit.slug}
              name={habit.name}
              description={habit.description}
              currentStreak={habit.currentStreak}
              todayStatus={habit.todayStatus}
              freezesAvailable={habit.freezesAvailable}
              frequency={habit.frequency}
              isNumeric={habit.isNumeric}
              unit={habit.unit}
              groupColor={habit.group?.color}
              groupName={habit.group?.name}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-12">
      {sectionsToRender.map((section) => {
        const isCollapsed = Boolean(collapsedGroups[section.id]);
        return (
          <div key={section.id} className="space-y-4">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleGroupCollapse(section.id)}
              className="flex items-center gap-3 w-full text-left py-2 px-3 rounded-xl hover:bg-surface/60 transition-colors group select-none cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-textSecondary group-hover:text-textPrimary transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>

              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: section.color }}
              />

              <h2 className="text-lg font-extrabold text-textPrimary tracking-tight group-hover:text-white transition-colors">
                {section.name}
              </h2>

              <span className="px-2 py-0.5 rounded-full bg-surface border border-surfaceBorder text-xs font-mono font-medium text-textSecondary">
                {section.items.length}
              </span>
            </button>

            {/* Habit Cards Grid (Shown when not collapsed) */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-2 sm:pl-4">
                {section.items.map((habit) => {
                  const cleanId = habit.id.includes("/") ? habit.id.split("/").filter(Boolean).pop()! : habit.id;
                  return (
                    <HabitCard
                      key={cleanId}
                      id={cleanId}
                      habitId={cleanId}
                      slug={habit.slug}
                      name={habit.name}
                      description={habit.description}
                      currentStreak={habit.currentStreak}
                      todayStatus={habit.todayStatus}
                      freezesAvailable={habit.freezesAvailable}
                      frequency={habit.frequency}
                      isNumeric={habit.isNumeric}
                      unit={habit.unit}
                      groupColor={habit.group?.color || (section.id !== "other" ? section.color : null)}
                      groupName={habit.group?.name || section.name}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

}
