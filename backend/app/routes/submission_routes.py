from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import RollingRound, Submission, User
from ..schemas import SubmissionCreate, SubmissionRead, SubmissionUpdate

router = APIRouter(prefix="/submissions", tags=["submissions"])


def validate_rolling_round(db: Session, rolling_round_id: int | None, user_id: int):
    if rolling_round_id is None:
        return
    rolling_round = (
        db.query(RollingRound)
        .filter(RollingRound.id == rolling_round_id, RollingRound.user_id == user_id)
        .first()
    )
    if not rolling_round:
        raise HTTPException(status_code=400, detail="Rolling round does not exist for this user")


@router.post("", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission(
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    validate_rolling_round(db, data.get("rolling_round_id"), current_user.id)

    submission = Submission(**data, user_id=current_user.id)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionRead])
def list_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Submission)
        .filter(Submission.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .all()
    )


@router.get("/{submission_id}", response_model=SubmissionRead)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_or_404(db, Submission, submission_id, current_user.id)


@router.put("/{submission_id}", response_model=SubmissionRead)
def update_submission(
    submission_id: int,
    payload: SubmissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = get_owned_or_404(db, Submission, submission_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    validate_rolling_round(db, updates.get("rolling_round_id"), current_user.id)

    apply_updates(submission, updates)
    db.commit()
    db.refresh(submission)
    return submission


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = get_owned_or_404(db, Submission, submission_id, current_user.id)
    db.delete(submission)
    db.commit()
    return None
