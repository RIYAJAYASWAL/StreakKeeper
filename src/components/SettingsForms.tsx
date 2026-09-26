"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SettingsFormsProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsForms({ initialUser }: SettingsFormsProps) {
  const router = useRouter();

  // Profile Section State
  const [profileName, setProfileName] = useState(initialUser.name || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Timezone Section State
  const [timezone, setTimezone] = useState(initialUser.timezone || "UTC");
  const [timezoneLoading, setTimezoneLoading] = useState(false);
  const [timezoneFeedback, setTimezoneFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Password Section State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Danger Zone State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Profile Submit Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileFeedback({ type: "error", msg: "Name cannot be empty." });
      return;
    }

    setProfileLoading(true);
    setProfileFeedback(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName.trim() }),
      });

      if (res.ok) {
        setProfileFeedback({ type: "success", msg: "Profile updated successfully!" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setProfileFeedback({ type: "error", msg: data.message || "Failed to update profile." });
      }
    } catch {
      setProfileFeedback({ type: "error", msg: "An error occurred while saving." });
    } finally {
      setProfileLoading(false);
    }
  };

  // 2. Timezone Submit Handler
  const handleTimezoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimezoneLoading(true);
    setTimezoneFeedback(null);

    try {
      const res = await fetch("/api/user/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });

      if (res.ok) {
        setTimezoneFeedback({ type: "success", msg: "Timezone updated successfully!" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setTimezoneFeedback({ type: "error", msg: data.message || "Failed to update timezone." });
      }
    } catch {
      setTimezoneFeedback({ type: "error", msg: "An error occurred while saving." });
    } finally {
      setTimezoneLoading(false);
    }
  };

  // 3. Password Submit Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      setPasswordFeedback({ type: "error", msg: "Please fill in all password fields." });
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordFeedback({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordFeedback({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    setPasswordFeedback(null);

    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.ok) {
        setPasswordFeedback({ type: "success", msg: "Password updated successfully!" });
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordFeedback({ type: "error", msg: data.message || "Incorrect current password." });
      }
    } catch {
      setPasswordFeedback({ type: "error", msg: "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  // 4. Delete Account Handler
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok || true) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: PROFILE */}
      <section className="p-6 sm:p-8 rounded-2xl bg-surface border border-surfaceBorder shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-textPrimary">Profile Information</h2>
          <p className="text-xs text-textSecondary mt-1">
            Update your account display name and view account details
          </p>
        </div>

        {profileFeedback && (
          <div
            className={`mb-6 p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileFeedback.type === "success"
                ? "bg-frozen/10 border border-frozen/30 text-frozen"
                : "bg-emberStart/10 border border-emberStart/30 text-emberStart"
            }`}
          >
            <span>{profileFeedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={initialUser.email}
              className="w-full px-4 py-3 rounded-xl bg-background/50 border border-surfaceBorder/60 text-textSecondary text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-textSecondary">
              Contact support to change your account email address.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm transition-all shadow-md shadow-violet/20 disabled:opacity-60"
            >
              {profileLoading ? "Saving Profile..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: TIMEZONE */}
      <section className="p-6 sm:p-8 rounded-2xl bg-surface border border-surfaceBorder shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-textPrimary">Timezone Preferences</h2>
          <p className="text-xs text-textSecondary mt-1">
            Day boundaries follow your local timezone to calculate habit check-ins accurately
          </p>
        </div>

        {timezoneFeedback && (
          <div
            className={`mb-6 p-3 rounded-xl text-xs flex items-center gap-2 ${
              timezoneFeedback.type === "success"
                ? "bg-frozen/10 border border-frozen/30 text-frozen"
                : "bg-emberStart/10 border border-emberStart/30 text-emberStart"
            }`}
          >
            <span>{timezoneFeedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleTimezoneSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Account Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors cursor-pointer"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-surface text-textPrimary">
                  {tz}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-textSecondary leading-relaxed">
              Habit reset times occur at midnight according to this setting.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={timezoneLoading}
              className="px-5 py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm transition-all shadow-md shadow-violet/20 disabled:opacity-60"
            >
              {timezoneLoading ? "Saving Timezone..." : "Save Timezone"}
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 3: CHANGE PASSWORD */}
      <section className="p-6 sm:p-8 rounded-2xl bg-surface border border-surfaceBorder shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-textPrimary">Change Password</h2>
          <p className="text-xs text-textSecondary mt-1">
            Ensure your account is using a long, secure password
          </p>
        </div>

        {passwordFeedback && (
          <div
            className={`mb-6 p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordFeedback.type === "success"
                ? "bg-frozen/10 border border-frozen/30 text-frozen"
                : "bg-emberStart/10 border border-emberStart/30 text-emberStart"
            }`}
          >
            <span>{passwordFeedback.msg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm transition-all shadow-md shadow-violet/20 disabled:opacity-60"
            >
              {passwordLoading ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 4: DANGER ZONE */}
      <section className="p-6 sm:p-8 rounded-2xl bg-surface border border-emberStart/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-emberStart">Danger Zone</h2>
            <p className="text-xs text-textSecondary mt-1">
              Permanently delete your account and all associated habit tracking data
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emberStart/10 border border-emberStart/40 text-emberStart hover:bg-emberStart/20 font-semibold text-sm transition-colors shrink-0"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emberStart">
              <div className="w-10 h-10 rounded-xl bg-emberStart/10 border border-emberStart/30 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-textPrimary">Delete Account Permanently?</h3>
            </div>

            <p className="text-sm text-textSecondary leading-relaxed">
              This action cannot be undone. All your habits, streak freezes, logs, and account settings will be erased immediately.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-background border border-surfaceBorder text-textSecondary hover:text-textPrimary font-semibold text-sm transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emberStart text-background font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
