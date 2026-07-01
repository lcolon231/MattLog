from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user
from ..models import RollingRound, TrainingSession, User
from ..schemas import DashboardStats, UserRead, UserUpdate

router = APIRouter(tags=["users"])


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
