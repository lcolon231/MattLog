from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .database import Base, engine
from .routes import (
    auth_routes,
    injury_routes,
    progress_routes,
    report_routes,
    rolling_routes,
    session_routes,
    technique_routes,
    user_routes,
)

Base.metadata.create_all(bind=engine)


def ensure_local_schema_updates():
    inspector = inspect(engine)
    if not inspector.has_table("injuries"):
        return

    injury_columns = {column["name"] for column in inspector.get_columns("injuries")}
    foreign_keys = inspector.get_foreign_keys("injuries")
    has_session_foreign_key = any(
        "session_id" in foreign_key.get("constrained_columns", [])
        for foreign_key in foreign_keys
    )

    with engine.begin() as connection:
        if "session_id" not in injury_columns:
            connection.execute(text("ALTER TABLE injuries ADD COLUMN session_id INTEGER"))
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_injuries_session_id ON injuries (session_id)")
        )
        if engine.dialect.name == "postgresql" and not has_session_foreign_key:
            connection.execute(
                text(
                    "ALTER TABLE injuries "
                    "ADD CONSTRAINT fk_injuries_session_id_training_sessions "
                    "FOREIGN KEY (session_id) REFERENCES training_sessions(id) "
                    "ON DELETE SET NULL"
                )
            )


ensure_local_schema_updates()

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
app.include_router(report_routes.router)
