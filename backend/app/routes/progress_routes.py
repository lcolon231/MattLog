from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import BeltProgress, User
from ..schemas import BeltProgressCreate, BeltProgressRead, BeltProgressUpdate

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("", response_model=BeltProgressRead, status_code=status.HTTP_201_CREATED)
def create_progress_entry(
    payload: BeltProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = BeltProgress(**payload.model_dump(), user_id=current_user.id)
    current_user.belt_rank = payload.belt_rank
    current_user.stripe_count = payload.stripe_count
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.get("", response_model=list[BeltProgressRead])
def list_progress_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(BeltProgress)
        .filter(BeltProgress.user_id == current_user.id)
        .order_by(BeltProgress.promotion_date.desc().nullslast(), BeltProgress.created_at.desc())
        .all()
    )


@router.put("/{progress_id}", response_model=BeltProgressRead)
def update_progress_entry(
    progress_id: int,
    payload: BeltProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = get_owned_or_404(db, BeltProgress, progress_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    apply_updates(progress, updates)

    if "belt_rank" in updates:
        current_user.belt_rank = updates["belt_rank"]
    if "stripe_count" in updates:
        current_user.stripe_count = updates["stripe_count"]

    db.commit()
    db.refresh(progress)
    return progress


@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress_entry(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = get_owned_or_404(db, BeltProgress, progress_id, current_user.id)
    db.delete(progress)
    db.commit()
    return None
