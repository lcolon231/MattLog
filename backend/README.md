# MatLog Backend

FastAPI backend for MatLog.

## Setup

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Environment Variables

```text
DATABASE_URL=postgresql://postgres:password@localhost:5432/matlog
SECRET_KEY=change_this_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Local Development

Create the PostgreSQL database first. Tables are created automatically when the app starts.

```powershell
psql -U postgres
CREATE DATABASE matlog;
\q
```

API docs are available at `http://localhost:8000/docs` while the server is running.
