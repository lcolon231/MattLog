from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import apply_updates, get_current_user, get_owned_or_404
from ..models import Technique, User
from ..schemas import TechniqueCreate, TechniqueRead, TechniqueUpdate

router = APIRouter(prefix="/techniques", tags=["techniques"])


@router.post("", response_model=TechniqueRead, status_code=status.HTTP_201_CREATED)
def create_technique(
    payload: TechniqueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    technique = Technique(**payload.model_dump(), user_id=current_user.id)
    db.add(technique)
    db.commit()
    db.refresh(technique)
    return technique


@router.get("", response_model=list[TechniqueRead])
def list_techniques(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Technique)
        .filter(Technique.user_id == current_user.id)
        .order_by(Technique.last_practiced.desc().nullslast(), Technique.created_at.desc())
        .all()
    )


@router.get("/{technique_id}", response_model=TechniqueRead)
def get_technique(
    technique_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_or_404(db, Technique, technique_id, current_user.id)


@router.put("/{technique_id}", response_model=TechniqueRead)
def update_technique(
    technique_id: int,
    payload: TechniqueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    technique = get_owned_or_404(db, Technique, technique_id, current_user.id)
    apply_updates(technique, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(technique)
    return technique


@router.delete("/{technique_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technique(
    technique_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    technique = get_owned_or_404(db, Technique, technique_id, current_user.id)
    db.delete(technique)
    db.commit()
    return None
