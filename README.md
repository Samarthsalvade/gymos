# GymOS — Gym Management SaaS

A full-stack multi-tenant gym management application.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Auth**: JWT (access + refresh tokens)
- **AI**: Google Gemini Flash API (optional)

## Quick Start

```bash
cd /Users/samarthgupta1812/GYM
./start.sh
```

Or manually:
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Live demo
- **App**: https://samarthsalvade.github.io/gymos/
- **API**: https://gymos-api-azure.vercel.app
- **Gym Code**: `DEMO01`
- **Admin**: admin@fitzone.com / admin123
- **Trainer**: trainer@fitzone.com / trainer123
- **Member**: arjun@example.com / member123

The site is on GitHub Pages. The API runs on Vercel’s free plan and uses the existing Neon Postgres database, also on the free plan. Nothing here requires a paid host. The first request after the database has been idle can take a few seconds while it wakes up.

## Local demo
- **URL**: http://localhost:5173
- **Gym Code**: `DEMO01`
- **Admin**: admin@fitzone.com / admin123
- **Member**: arjun@example.com / member123

## Enable AI Features
Add your Gemini API key to `backend/.env`:
```
GEMINI_API_KEY=your_key_here
```
Get a free key at https://aistudio.google.com

## Features
### Admin Portal
- Dashboard with live stats (check-ins, revenue, churn risk)
- Member CRUD with QR code generation
- Membership plans & payment tracking
- Attendance tracking (QR + manual)
- Equipment inventory management
- Events & announcements (notifies all members)
- Revenue reports with charts
- Churn risk detection
- AI business insights (requires Gemini key)
- Per-gym branding (name, accent color)

### Member Portal
- Dashboard with streak & attendance stats
- QR-based self check-in
- AI-generated personalized workout plan
- Progress logging (weight, measurements) with charts
- Badges & streaks (7, 30, 100, 365 day milestones)
- Gym-wide attendance leaderboard
- Membership & payment history
- Events feed
- Notifications (renewal alerts, badges, events)

## Project Structure
```
GYM/
├── backend/          Node.js + Express API
│   ├── prisma/       Database schema + seed
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── .env          Configure here
└── frontend/         React + Vite app
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        │   ├── admin/
        │   └── member/
        └── store/
```
