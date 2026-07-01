from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Injury, RollingRound, Technique, TrainingSession, User
from ..schemas import CoachSummary

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/coach-summary", response_model=CoachSummary)
def get_coach_summary(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    sessions = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.user_id == current_user.id,
            TrainingSession.date >= start_date,
            TrainingSession.date <= end_date,
        )
        .order_by(TrainingSession.date.desc(), TrainingSession.created_at.desc())
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

    recent_rolling = [
        round_entry
        for round_entry in rolling_rounds
        if start_date <= rolling_date(round_entry) <= end_date
    ]
    active_injuries = (
        db.query(Injury)
        .filter(Injury.user_id == current_user.id, Injury.resolved.is_(False))
        .order_by(Injury.pain_level.desc(), Injury.created_at.desc())
        .all()
    )
    recent_techniques = (
        db.query(Technique)
        .filter(Technique.user_id == current_user.id)
        .order_by(Technique.last_practiced.desc().nullslast(), Technique.created_at.desc())
        .limit(8)
        .all()
    )
    recent_notes = [
        note
        for session in sessions[:8]
        for note in (session.techniques_learned, session.notes)
        if note
    ][:8]

    return {
        "date_range": f"{start_date.isoformat()} to {end_date.isoformat()}",
        "total_sessions": len(sessions),
        "total_training_minutes": sum(session.duration_minutes for session in sessions),
        "total_rolling_rounds": sum(round_entry.rounds_count for round_entry in recent_rolling),
        "total_rolling_minutes": sum(round_entry.total_minutes for round_entry in recent_rolling),
        "active_injuries": active_injuries,
        "recent_techniques": recent_techniques,
        "recent_notes": recent_notes,
        "belt_rank": current_user.belt_rank,
        "stripe_count": current_user.stripe_count,
    }
