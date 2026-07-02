from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .database import Base, engine
from .routes import (
    auth_routes,
    competition_routes,
    goal_routes,
    injury_routes,
    milestone_routes,
    progress_routes,
    report_routes,
    rolling_routes,
    session_routes,
    technique_routes,
    user_routes,
)

Base.metadata.create_all(bind=engine)


def add_column_if_missing(connection, table_name: str, columns: set[str], name: str, definition: str):
    if name not in columns:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {definition}"))
        columns.add(name)


def ensure_local_schema_updates():
    inspector = inspect(engine)
    with engine.begin() as connection:
        if inspector.has_table("injuries"):
            injury_columns = {column["name"] for column in inspector.get_columns("injuries")}
            foreign_keys = inspector.get_foreign_keys("injuries")
            has_session_foreign_key = any(
                "session_id" in foreign_key.get("constrained_columns", [])
                for foreign_key in foreign_keys
            )
            add_column_if_missing(connection, "injuries", injury_columns, "session_id", "INTEGER")
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

        if inspector.has_table("rolling_rounds"):
            rolling_columns = {column["name"] for column in inspector.get_columns("rolling_rounds")}
            add_column_if_missing(connection, "rolling_rounds", rolling_columns, "submissions_hit", "INTEGER NOT NULL DEFAULT 0")
            add_column_if_missing(connection, "rolling_rounds", rolling_columns, "submissions_conceded", "INTEGER NOT NULL DEFAULT 0")
            add_column_if_missing(connection, "rolling_rounds", rolling_columns, "positions_won", "INTEGER NOT NULL DEFAULT 0")
            add_column_if_missing(connection, "rolling_rounds", rolling_columns, "positions_lost", "INTEGER NOT NULL DEFAULT 0")
            add_column_if_missing(connection, "rolling_rounds", rolling_columns, "partner_belt_rank", "VARCHAR(40)")

        if inspector.has_table("techniques"):
            technique_columns = {column["name"] for column in inspector.get_columns("techniques")}
            add_column_if_missing(connection, "techniques", technique_columns, "progress_stage", "VARCHAR(40) NOT NULL DEFAULT 'Learning'")
            add_column_if_missing(connection, "techniques", technique_columns, "needs_reps", "BOOLEAN NOT NULL DEFAULT TRUE")
            add_column_if_missing(connection, "techniques", technique_columns, "revisit_on", "DATE")


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
app.include_router(goal_routes.router)
app.include_router(milestone_routes.router)
app.include_router(competition_routes.router)
app.include_router(report_routes.router)
