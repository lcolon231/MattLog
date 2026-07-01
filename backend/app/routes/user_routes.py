from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user
from ..models import Injury, RollingRound, TrainingSession, User
from ..schemas import DashboardInjuryAlert, DashboardStats, TrainingLoadSummary, UserRead, UserUpdate

router = APIRouter(tags=["users"])


def change_percent(current: int, previous: int) -> float | None:
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


@router.get("/users/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/users/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates:
        existing = (
            db.query(User)
            .filter(User.email == updates["email"], User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email is already registered")

    apply_updates(current_user, updates)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_sessions = (
        db.query(func.count(TrainingSession.id))
        .filter(TrainingSession.user_id == current_user.id)
        .scalar()
        or 0
    )
    total_training_minutes = (
        db.query(func.coalesce(func.sum(TrainingSession.duration_minutes), 0))
        .filter(TrainingSession.user_id == current_user.id)
        .scalar()
        or 0
    )
    total_rolling_rounds = (
        db.query(func.coalesce(func.sum(RollingRound.rounds_count), 0))
        .filter(RollingRound.user_id == current_user.id)
        .scalar()
        or 0
    )
    total_rolling_minutes = (
        db.query(func.coalesce(func.sum(RollingRound.total_minutes), 0))
        .filter(RollingRound.user_id == current_user.id)
        .scalar()
        or 0
    )

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    sessions_this_week = (
        db.query(func.count(TrainingSession.id))
        .filter(
            TrainingSession.user_id == current_user.id,
            TrainingSession.date >= week_start,
        )
        .scalar()
        or 0
    )

    most_recent_session = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == current_user.id)
        .order_by(TrainingSession.date.desc(), TrainingSession.created_at.desc())
        .first()
    )

    return {
        "total_sessions": total_sessions,
        "total_training_minutes": total_training_minutes,
        "total_training_hours": round(total_training_minutes / 60, 1),
        "total_rolling_rounds": total_rolling_rounds,
        "total_rolling_minutes": total_rolling_minutes,
        "current_belt": current_user.belt_rank,
        "current_stripes": current_user.stripe_count,
        "most_recent_session": most_recent_session,
        "sessions_this_week": sessions_this_week,
    }


@router.get("/dashboard/injury-alerts", response_model=list[DashboardInjuryAlert])
def get_injury_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Injury)
        .filter(Injury.user_id == current_user.id, Injury.resolved.is_(False))
        .order_by(Injury.pain_level.desc(), Injury.created_at.desc())
        .all()
    )


@router.get("/dashboard/training-load", response_model=TrainingLoadSummary)
def get_training_load(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    this_week_start = today - timedelta(days=today.weekday())
    next_week_start = this_week_start + timedelta(days=7)
    last_week_start = this_week_start - timedelta(days=7)

    this_week_sessions = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.user_id == current_user.id,
            TrainingSession.date >= this_week_start,
            TrainingSession.date < next_week_start,
        )
        .all()
    )
    last_week_sessions = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.user_id == current_user.id,
            TrainingSession.date >= last_week_start,
            TrainingSession.date < this_week_start,
        )
        .all()
    )

    rolling_rounds = (
        db.query(RollingRound)
        .filter(RollingRound.user_id == current_user.id)
        .all()
    )

    def rolling_date(round_entry: RollingRound):
        if round_entry.session:
            return round_entry.session.date
        return round_entry.created_at.date()

    this_week_rolling = [
        round_entry
        for round_entry in rolling_rounds
        if this_week_start <= rolling_date(round_entry) < next_week_start
    ]
    last_week_rolling = [
        round_entry
        for round_entry in rolling_rounds
        if last_week_start <= rolling_date(round_entry) < this_week_start
    ]

    training_minutes_this_week = sum(session.duration_minutes for session in this_week_sessions)
    training_minutes_last_week = sum(session.duration_minutes for session in last_week_sessions)
    rolling_minutes_this_week = sum(round_entry.total_minutes for round_entry in this_week_rolling)
    rolling_minutes_last_week = sum(round_entry.total_minutes for round_entry in last_week_rolling)
    rolling_rounds_this_week = sum(round_entry.rounds_count for round_entry in this_week_rolling)
    rolling_rounds_last_week = sum(round_entry.rounds_count for round_entry in last_week_rolling)
    training_change = change_percent(training_minutes_this_week, training_minutes_last_week)
    rolling_change = change_percent(rolling_minutes_this_week, rolling_minutes_last_week)

    warnings = []
    if training_change is not None and training_change > 35:
        warnings.append("Training volume is up more than 35% from last week.")
    if rolling_change is not None and rolling_change > 35:
        warnings.append("Rolling volume is up more than 35% from last week.")

    return {
        "sessions_this_week": len(this_week_sessions),
        "sessions_last_week": len(last_week_sessions),
        "training_minutes_this_week": training_minutes_this_week,
        "training_minutes_last_week": training_minutes_last_week,
        "rolling_minutes_this_week": rolling_minutes_this_week,
        "rolling_minutes_last_week": rolling_minutes_last_week,
        "rolling_rounds_this_week": rolling_rounds_this_week,
        "rolling_rounds_last_week": rolling_rounds_last_week,
        "training_minutes_change_percent": training_change,
        "rolling_minutes_change_percent": rolling_change,
        "warning_message": " ".join(warnings) if warnings else None,
    }
