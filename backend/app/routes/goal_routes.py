from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import TrainingGoal, User
from ..schemas import TrainingGoalCreate, TrainingGoalRead, TrainingGoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=TrainingGoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: TrainingGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = TrainingGoal(**payload.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("", response_model=list[TrainingGoalRead])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(TrainingGoal)
        .filter(TrainingGoal.user_id == current_user.id)
        .order_by(TrainingGoal.month.desc(), TrainingGoal.created_at.desc())
        .all()
    )


@router.put("/{goal_id}", response_model=TrainingGoalRead)
def update_goal(
    goal_id: int,
    payload: TrainingGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_owned_or_404(db, TrainingGoal, goal_id, current_user.id)
    apply_updates(goal, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_owned_or_404(db, TrainingGoal, goal_id, current_user.id)
    db.delete(goal)
    db.commit()
    return None
