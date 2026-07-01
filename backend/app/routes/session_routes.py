from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import TrainingSession, User
from ..schemas import TrainingSessionCreate, TrainingSessionRead, TrainingSessionUpdate

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=TrainingSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: TrainingSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = TrainingSession(**payload.model_dump(), user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[TrainingSessionRead])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == current_user.id)
        .order_by(TrainingSession.date.desc(), TrainingSession.created_at.desc())
        .all()
    )


@router.get("/{session_id}", response_model=TrainingSessionRead)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_or_404(db, TrainingSession, session_id, current_user.id)


@router.put("/{session_id}", response_model=TrainingSessionRead)
def update_session(
    session_id: int,
    payload: TrainingSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_owned_or_404(db, TrainingSession, session_id, current_user.id)
    apply_updates(session, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_owned_or_404(db, TrainingSession, session_id, current_user.id)
    db.delete(session)
    db.commit()
    return None
