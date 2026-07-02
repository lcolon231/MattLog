from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import Competition, User
from ..schemas import CompetitionCreate, CompetitionRead, CompetitionUpdate

router = APIRouter(prefix="/competitions", tags=["competitions"])


@router.post("", response_model=CompetitionRead, status_code=status.HTTP_201_CREATED)
def create_competition(
    payload: CompetitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competition = Competition(**payload.model_dump(), user_id=current_user.id)
    db.add(competition)
    db.commit()
    db.refresh(competition)
    return competition


@router.get("", response_model=list[CompetitionRead])
def list_competitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Competition)
        .filter(Competition.user_id == current_user.id)
        .order_by(Competition.competition_date.desc(), Competition.created_at.desc())
        .all()
    )


@router.put("/{competition_id}", response_model=CompetitionRead)
def update_competition(
    competition_id: int,
    payload: CompetitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competition = get_owned_or_404(db, Competition, competition_id, current_user.id)
    apply_updates(competition, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(competition)
    return competition


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_competition(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    competition = get_owned_or_404(db, Competition, competition_id, current_user.id)
    db.delete(competition)
    db.commit()
    return None
