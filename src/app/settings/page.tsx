import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingsForms from "@/components/SettingsForms";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id || "demo-user-id";

  let userProfile = {
    id: userId,
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    timezone: "UTC",
  };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (dbUser) {
      userProfile = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        timezone: dbUser.timezone,
      };
    }
  } catch {
    // Fallback mode if DB is disconnected
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col selection:bg-violet/30 selection:text-textPrimary">
      {/* Header */}
      <header className="w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
          <h1 className="text-3xl font-extrabold text-textPrimary tracking-tight">Account Settings</h1>
          <p className="text-sm text-textSecondary mt-1">
            Manage your profile info, timezone offset, password, and preferences
          </p>
        </div>

        {/* Client Settings Sections */}
        <SettingsForms initialUser={userProfile} />
      </main>
    </div>
  );
}
