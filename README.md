# MatLog

MatLog is a full-stack Brazilian Jiu-Jitsu training journal. It helps students connect mat time, technique progress, rolling volume, recovery, injury history, competition days, and long-term progress from a mobile-friendly web app.

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Auth: JWT with bcrypt password hashing
- API style: REST

## Database Setup

Create a local PostgreSQL database named `matlog`.

Example with `psql`:

```powershell
psql -U postgres
CREATE DATABASE matlog;
\q
```

Copy the backend environment file and edit values if needed:

```powershell
cd backend
copy .env.example .env
```

Default database URL:

```text
postgresql://postgres:password@localhost:5432/matlog
```

## Backend Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

Useful endpoints:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /dashboard/stats`
- `GET /dashboard/injury-alerts`
- `GET /dashboard/training-load`
- `GET /rolling/stats/weekly`
- `GET /reports/coach-summary?days=30`
- `GET /reports/coach-summary.csv?days=30`
- `GET /reports/coach-summary.pdf?days=30`
- `GET /reports/timeline?days=365`

## Product Features

- Injury-aware training with session-linked injury logs and dashboard warnings.
- Technique stages: Learning, Drilling, Live-tested, Reliable.
- Needs-reps technique sorting and revisit dates.
- Rolling insights for rounds, minutes, submissions, positions, notes, and partner belt rank.
- Monthly training goals.
- Competition mode for plans, divisions, results, and notes.
- Athlete timeline for first class, promotions, injuries, competitions, and personal milestones.
- Coach-friendly copy, CSV, and PDF reports.
- Installable PWA shell for mobile use.

## Supabase Notes

MatLog already reads `DATABASE_URL`, so it can point at a Supabase Postgres connection string for hosting the database. The current app still uses FastAPI JWT auth and SQLAlchemy-owned tables. A full Supabase Auth migration should be done as a dedicated step with project credentials, RLS policies, and auth/session testing.

FastAPI creates tables automatically on startup for local development.

## Frontend Setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The web app runs at `http://localhost:5173`.

If your API runs somewhere else, set `VITE_API_URL` before starting Vite.
