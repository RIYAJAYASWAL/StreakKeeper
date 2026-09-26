import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col font-sans selection:bg-violet/30 selection:text-textPrimary">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#8B5CF6]/15 via-[#FF6B6B]/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FF9F1C]/5 blur-[140px] rounded-full" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-ember-gradient p-0.5 shadow-lg shadow-[#FF6B6B]/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-emberMid" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-textPrimary group-hover:text-white transition-colors">
              Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-textSecondary hover:text-violet transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="relative group px-5 py-2.5 rounded-xl bg-ember-gradient text-background font-semibold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:shadow-[#FF6B6B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-surfaceBorder text-xs sm:text-sm font-medium text-textSecondary mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-frozen animate-pulse" />
          <span>Forgiving streak tracking for real human lives</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-textPrimary leading-[1.15]">
          Streaks that <span className="text-transparent bg-clip-text bg-ember-gradient">forgive one bad day</span> instead of punishing you.
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-lg sm:text-xl text-textSecondary max-w-2xl font-normal leading-relaxed">
          Life happens. StreakKeeper uses timezone-smart tracking and monthly streak freezes so a busy day or travel doesn't erase months of hard work.
        </p>

        {/* CTA Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-ember-gradient text-background font-bold text-base shadow-lg shadow-[#FF6B6B]/25 hover:shadow-xl hover:shadow-[#FF6B6B]/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            Get Started Free
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-surfaceBorder text-textPrimary hover:text-violet hover:border-violet/40 font-semibold text-base transition-all duration-200 flex items-center justify-center"
          >
            Log In to Account
          </Link>
        </div>

        {/* Hero Interactive UI Preview Card */}
        <div className="mt-16 sm:mt-20 w-full max-w-4xl rounded-2xl bg-surface/90 border border-surfaceBorder p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/50 to-transparent" />
          
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-surfaceBorder/80">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF6B6B]/40" />
                <div className="w-3 h-3 rounded-full bg-[#FF9F1C]/40" />
                <div className="w-3 h-3 rounded-full bg-[#5EEAD4]/40" />
              </div>
              <span className="text-xs text-textSecondary font-mono ml-2">Today's Overview • UTC+05:30</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-frozen bg-frozen/10 px-3 py-1 rounded-full border border-frozen/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.236l-1.591 1.591M4.5 12H2.25m3.886-6.364L4.545 4.045M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span>3 Freezes Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Habit Card 1 */}
            <div className="p-4 rounded-xl bg-background/60 border border-surfaceBorder flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-textPrimary text-sm">Morning Meditation</h4>
                  <p className="text-xs text-textSecondary mt-0.5">Daily • 15 mins</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emberStart/10 text-emberStart border border-emberStart/20">
                  🔥 42 Days
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder/40">
                <span className="text-xs text-frozen font-medium flex items-center gap-1">
                  ✓ Completed today
                </span>
                <div className="w-5 h-5 rounded-full bg-frozen/20 flex items-center justify-center text-frozen text-xs">
                  ✓
                </div>
              </div>
            </div>

            {/* Habit Card 2 */}
            <div className="p-4 rounded-xl bg-background/60 border border-surfaceBorder flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-textPrimary text-sm">Deep Work Coding</h4>
                  <p className="text-xs text-textSecondary mt-0.5">Mon, Wed, Fri</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-frozen/10 text-frozen border border-frozen/20">
                  🧊 Frozen Yesterday
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder/40">
                <span className="text-xs text-textSecondary font-medium">Streak Saved</span>
                <span className="text-xs text-frozen font-mono">2 Freezes Left</span>
              </div>
            </div>

            {/* Habit Card 3 */}
            <div className="p-4 rounded-xl bg-background/60 border border-surfaceBorder flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-textPrimary text-sm">Evening Reading</h4>
                  <p className="text-xs text-textSecondary mt-0.5">Daily • 20 pages</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emberMid/10 text-emberMid border border-emberMid/20">
                  🔥 18 Days
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder/40">
                <span className="text-xs text-textSecondary">Ready for check-in</span>
                <div className="w-5 h-5 rounded-full border border-violet/40 hover:border-violet flex items-center justify-center text-xs text-violet cursor-pointer">
                  +
                </div>
              </div>
            </div>
          </div>

          {/* Mini Heatmap Visualization Preview */}
          <div className="p-4 rounded-xl bg-background/40 border border-surfaceBorder/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-textSecondary">2026 Consistency Heatmap</span>
              <div className="flex items-center gap-2 text-[10px] text-textSecondary">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-muted/40" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emberStart/40" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emberMid/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emberEnd" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-frozen" />
                </div>
                <span>More</span>
              </div>
            </div>
            
            {/* Grid Cells */}
            <div className="grid grid-rows-4 grid-flow-col gap-1.5 overflow-x-auto py-1">
              {Array.from({ length: 112 }).map((_, i) => {
                const isFrozen = i === 14 || i === 45 || i === 88;
                const isMissed = i === 22 || i === 67;
                const isHigh = i % 3 === 0 && !isFrozen && !isMissed;
                const isMid = i % 2 === 0 && !isHigh && !isFrozen && !isMissed;
                
                let bgClass = "bg-muted/30";
                if (isFrozen) bgClass = "bg-frozen shadow-sm shadow-frozen/50";
                else if (isMissed) bgClass = "bg-muted/70";
                else if (isHigh) bgClass = "bg-emberEnd";
                else if (isMid) bgClass = "bg-emberStart";

                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm transition-transform hover:scale-125 ${bgClass}`}
                    title={isFrozen ? "Streak Frozen" : "Completed"}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Feature Section */}
        <section className="mt-28 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-textPrimary">
              Designed around <span className="text-transparent bg-clip-text bg-ember-gradient">how life actually works</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-textSecondary max-w-xl mx-auto">
              Most habit apps punish you when you need flexibility. StreakKeeper keeps you motivated without the burnout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl bg-surface border border-surfaceBorder hover:border-violet/40 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center text-violet mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-3 group-hover:text-violet transition-colors">
                  Timezone-smart tracking
                </h3>
                <p className="text-textSecondary text-sm leading-relaxed">
                  Day boundaries follow <strong className="text-textPrimary font-semibold">YOUR local time</strong>, not server time. Late-night check-ins and international travel will never unfairly break your streak.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-surfaceBorder/60 flex items-center text-xs text-violet font-medium gap-1">
                <span>Automatic offset matching</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl bg-surface border border-surfaceBorder hover:border-frozen/40 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-frozen/10 border border-frozen/20 flex items-center justify-center text-frozen mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.236l-1.591 1.591M4.5 12H2.25m3.886-6.364L4.545 4.045M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-3 group-hover:text-frozen transition-colors">
                  Streak freezes
                </h3>
                <p className="text-textSecondary text-sm leading-relaxed">
                  Limited monthly freezes step in when sick days or emergencies happen. One missed day pauses your counter so months of momentum aren't wiped out overnight.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-surfaceBorder/60 flex items-center text-xs text-frozen font-medium gap-1">
                <span>3 Freezes included per habit</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl bg-surface border border-surfaceBorder hover:border-emberMid/40 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emberMid/10 border border-emberMid/20 flex items-center justify-center text-emberMid mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-3 group-hover:text-emberMid transition-colors">
                  GitHub-style heatmap
                </h3>
                <p className="text-textSecondary text-sm leading-relaxed">
                  Visualize your consistency over the entire year with beautiful contribution grids. Watch your progress compound tile by tile as habits stick long-term.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-surfaceBorder/60 flex items-center text-xs text-emberMid font-medium gap-1">
                <span>Annual contribution analytics</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section className="mt-28 w-full rounded-2xl bg-surface border border-surfaceBorder p-8 sm:p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-violet/10 via-transparent to-emberMid/10 pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-bold text-textPrimary mb-4">
            Ready to build habits that actually last?
          </h2>
          <p className="text-textSecondary text-sm sm:text-base max-w-xl mx-auto mb-8">
            Join thousands of users building sustainable routines with StreakKeeper.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-ember-gradient text-background font-bold text-base shadow-lg shadow-[#FF6B6B]/25 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Start Your First Streak Free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surfaceBorder/60 py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <span className="font-semibold text-textPrimary">StreakKeeper</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-textSecondary">
            <Link href="/privacy" className="hover:text-textPrimary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-textPrimary transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-violet transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-emberMid transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
