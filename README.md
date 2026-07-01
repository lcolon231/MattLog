# MatLog

MatLog is a full-stack Brazilian Jiu-Jitsu training tracker. Students can log classes, rolling rounds, techniques, injuries, and belt progress from a mobile-friendly web app.

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
- `GET /reports/coach-summary?days=30`

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
