from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import Injury, User
from ..schemas import InjuryCreate, InjuryRead, InjuryUpdate

router = APIRouter(prefix="/injuries", tags=["injuries"])


@router.post("", response_model=InjuryRead, status_code=status.HTTP_201_CREATED)
def create_injury(
    payload: InjuryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    injury = Injury(**payload.model_dump(), user_id=current_user.id)
    db.add(injury)
    db.commit()
    db.refresh(injury)
    return injury


@router.get("", response_model=list[InjuryRead])
def list_injuries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Injury)
        .filter(Injury.user_id == current_user.id)
        .order_by(Injury.resolved.asc(), Injury.created_at.desc())
        .all()
    )


@router.get("/{injury_id}", response_model=InjuryRead)
def get_injury(
    injury_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_or_404(db, Injury, injury_id, current_user.id)


@router.put("/{injury_id}", response_model=InjuryRead)
def update_injury(
    injury_id: int,
    payload: InjuryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    injury = get_owned_or_404(db, Injury, injury_id, current_user.id)
    apply_updates(injury, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(injury)
    return injury


@router.delete("/{injury_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_injury(
    injury_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    injury = get_owned_or_404(db, Injury, injury_id, current_user.id)
    db.delete(injury)
    db.commit()
    return None
