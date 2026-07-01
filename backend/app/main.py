from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import (
    auth_routes,
    injury_routes,
    progress_routes,
    rolling_routes,
    session_routes,
    technique_routes,
    user_routes,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MatLog API",
    description="Training log API for Brazilian Jiu-Jitsu students.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "matlog-api"}


app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(session_routes.router)
app.include_router(rolling_routes.router)
app.include_router(technique_routes.router)
app.include_router(injury_routes.router)
app.include_router(progress_routes.router)
