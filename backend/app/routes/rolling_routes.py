from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import RollingRound, TrainingSession, User
from ..schemas import RollingRoundCreate, RollingRoundRead, RollingRoundUpdate

router = APIRouter(prefix="/rolling", tags=["rolling"])


def validate_session(db: Session, session_id: int | None, user_id: int):
    if session_id is None:
        return
    session = (
        db.query(TrainingSession)
        .filter(TrainingSession.id == session_id, TrainingSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=400, detail="Session does not exist for this user")


def set_total_minutes(data: dict) -> dict:
    if not data.get("total_minutes") and data.get("rounds_count") and data.get("round_length_minutes"):
        data["total_minutes"] = data["rounds_count"] * data["round_length_minutes"]
    return data


@router.post("", response_model=RollingRoundRead, status_code=status.HTTP_201_CREATED)
def create_rolling_round(
    payload: RollingRoundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = set_total_minutes(payload.model_dump())
    validate_session(db, data.get("session_id"), current_user.id)

    rolling_round = RollingRound(**data, user_id=current_user.id)
    db.add(rolling_round)
    db.commit()
    db.refresh(rolling_round)
    return rolling_round


@router.get("", response_model=list[RollingRoundRead])
def list_rolling_rounds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RollingRound)
        .filter(RollingRound.user_id == current_user.id)
        .order_by(RollingRound.created_at.desc())
        .all()
    )


@router.get("/{rolling_id}", response_model=RollingRoundRead)
def get_rolling_round(
    rolling_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_or_404(db, RollingRound, rolling_id, current_user.id)


@router.put("/{rolling_id}", response_model=RollingRoundRead)
def update_rolling_round(
    rolling_id: int,
    payload: RollingRoundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rolling_round = get_owned_or_404(db, RollingRound, rolling_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    validate_session(db, updates.get("session_id"), current_user.id)

    preview = {
        "rounds_count": updates.get("rounds_count", rolling_round.rounds_count),
        "round_length_minutes": updates.get(
            "round_length_minutes", rolling_round.round_length_minutes
        ),
        "total_minutes": updates.get("total_minutes"),
    }
    if "total_minutes" not in updates:
        updates["total_minutes"] = (
            preview["rounds_count"] * preview["round_length_minutes"]
        )

    apply_updates(rolling_round, updates)
    db.commit()
    db.refresh(rolling_round)
    return rolling_round


@router.delete("/{rolling_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rolling_round(
    rolling_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rolling_round = get_owned_or_404(db, RollingRound, rolling_id, current_user.id)
    db.delete(rolling_round)
    db.commit()
    return None
