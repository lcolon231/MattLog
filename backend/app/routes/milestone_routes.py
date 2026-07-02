from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import PersonalMilestone, User
from ..schemas import PersonalMilestoneCreate, PersonalMilestoneRead, PersonalMilestoneUpdate

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.post("", response_model=PersonalMilestoneRead, status_code=status.HTTP_201_CREATED)
def create_milestone(
    payload: PersonalMilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = PersonalMilestone(**payload.model_dump(), user_id=current_user.id)
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("", response_model=list[PersonalMilestoneRead])
def list_milestones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PersonalMilestone)
        .filter(PersonalMilestone.user_id == current_user.id)
        .order_by(PersonalMilestone.milestone_date.desc(), PersonalMilestone.created_at.desc())
        .all()
    )


@router.put("/{milestone_id}", response_model=PersonalMilestoneRead)
def update_milestone(
    milestone_id: int,
    payload: PersonalMilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_owned_or_404(db, PersonalMilestone, milestone_id, current_user.id)
    apply_updates(milestone, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_owned_or_404(db, PersonalMilestone, milestone_id, current_user.id)
    db.delete(milestone)
    db.commit()
    return None
