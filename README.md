# StreakKeeper🔥

A habit tracker built around **honest streak tracking** — instead of punishing you with a hard reset on one missed day, HabitFlow uses timezone-aware day boundaries and a limited monthly "freeze" system, so a single bad day doesn't erase your progress.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **Timezone-smart tracking** — "today" is calculated in *your* local timezone, not the server's, so day boundaries never break when you travel or the server sits in a different region.
- **Streak freezes** — a limited number of monthly freezes let you preserve a streak after a missed day instead of resetting to zero, encouraging honest tracking over streak-anxiety-driven abandonment.
- **GitHub-style heatmap** — a full-year contribution-style calendar visualizes consistency per habit, with color intensity reflecting streak strength.
- **Flexible frequency** — track habits daily, weekly, or on custom selected days (e.g. gym on Mon/Wed/Fri).
- **Shareable public streaks** — optionally generate a read-only public link for a habit so others can see your progress without needing an account.
- **Automated missed-day detection** — a scheduled job marks days as missed if you never checked in or applied a freeze, keeping streak math accurate without manual bookkeeping.

## 🖼️ Preview

*(Add a screenshot or GIF of the dashboard here once deployed — e.g. `![Dashboard](./docs/screenshot-dashboard.png)`)*

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| Database | PostgreSQL via [Prisma](https://www.prisma.io/) ORM |
| Auth | [NextAuth.js](https://next-auth.js.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| DB Hosting | [Neon](https://neon.tech) (free tier, serverless Postgres) |
| Deployment | [GitHub Pages] |

## 📐 Data Model

```
User        →  has many Habits
Habit       →  has many HabitLogs (name, frequency, targetDays, freezesAvailable)
HabitLog    →  one entry per habit per day (status: DONE / MISSED / FROZEN)
```

Full schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma). Core streak-calculation logic (timezone handling, gap/freeze rules) lives in [`src/lib/streakEngine.ts`](./src/lib/streakEngine.ts).

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, signup
│   ├── (dashboard)/     # dashboard, habits, settings
│   ├── share/[publicId] # public read-only streak page
│   └── api/              # habits, logs, freeze, cron routes
├── components/           # HabitCard, HeatmapCalendar, etc.
├── lib/                  # prisma client, auth config, streak engine
└── types/
```

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/StreakKeeper.git
cd StreakKeeper
npm install
```

### 2. Set up a database (free)

**Recommended — [Neon](https://neon.tech):**
1. Sign up (no credit card required).
2. Create a project and copy the connection string from the dashboard.

**Or locally:**
```bash
psql -U postgres
CREATE DATABASE habitflow;
\q
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://your-connection-string-here"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="any-random-string"
```

### 4. Push the schema and run

```bash
npx prisma db push
npm run dev
```

Visit `http://localhost:3000`.

---

## ☁️ Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com).
3. Add the same environment variables from `.env` in the Vercel project settings, setting `NEXTAUTH_URL` to your live domain.
4. Add a `vercel.json` cron entry to schedule the daily missed-day check:
   ```json
   {
     "crons": [
       { "path": "/api/cron/streak-check", "schedule": "0 0 * * *" }
     ]
   }
   ```

## 🤝 Contributing

Issues and pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## 📄 License

[MIT](./LICENSE)
