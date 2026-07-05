from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    belt_rank = Column(String(40), nullable=False, default="white")
    stripe_count = Column(Integer, nullable=False, default=0)
    academy_name = Column(String(160), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    sessions = relationship("TrainingSession", back_populates="user", cascade="all, delete-orphan")
    rolling_rounds = relationship("RollingRound", back_populates="user", cascade="all, delete-orphan")
    techniques = relationship("Technique", back_populates="user", cascade="all, delete-orphan")
    injuries = relationship("Injury", back_populates="user", cascade="all, delete-orphan")
    progress_entries = relationship("BeltProgress", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("TrainingGoal", back_populates="user", cascade="all, delete-orphan")
    milestones = relationship("PersonalMilestone", back_populates="user", cascade="all, delete-orphan")
    competitions = relationship("Competition", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    class_type = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    intensity = Column(String(40), nullable=False)
    techniques_learned = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    felt_dizzy = Column(Boolean, nullable=False, default=False)
    fasted_before_training = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    rolling_rounds = relationship("RollingRound", back_populates="session")
    injuries = relationship("Injury", back_populates="session", passive_deletes=True)


class RollingRound(Base):
    __tablename__ = "rolling_rounds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=True, index=True)
    rounds_count = Column(Integer, nullable=False)
    round_length_minutes = Column(Integer, nullable=False)
    total_minutes = Column(Integer, nullable=False)
    submissions_hit = Column(Integer, nullable=False, default=0)
    submissions_conceded = Column(Integer, nullable=False, default=0)
    positions_won = Column(Integer, nullable=False, default=0)
    positions_lost = Column(Integer, nullable=False, default=0)
    partner_belt_rank = Column(String(40), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="rolling_rounds")
    session = relationship("TrainingSession", back_populates="rolling_rounds")
    submissions = relationship("Submission", back_populates="rolling_round", passive_deletes=True)


class Technique(Base):
    __tablename__ = "techniques"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    category = Column(String(80), nullable=False)
    gi_or_nogi = Column(String(20), nullable=False)
    confidence_level = Column(Integer, nullable=False, default=1)
    progress_stage = Column(String(40), nullable=False, default="Learning")
    needs_reps = Column(Boolean, nullable=False, default=True)
    revisit_on = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    last_practiced = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="techniques")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rolling_round_id = Column(
        Integer,
        ForeignKey("rolling_rounds.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    technique_name = Column(String(160), nullable=False)
    result = Column(String(20), nullable=False)
    opponent_belt_rank = Column(String(40), nullable=True)
    count = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="submissions")
    rolling_round = relationship("RollingRound", back_populates="submissions")


class Injury(Base):
    __tablename__ = "injuries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(
        Integer,
        ForeignKey("training_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    body_part = Column(String(100), nullable=False)
    pain_level = Column(Integer, nullable=False)
    cause = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    training_modification = Column(Text, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="injuries")
    session = relationship("TrainingSession", back_populates="injuries")


class BeltProgress(Base):
    __tablename__ = "belt_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    belt_rank = Column(String(40), nullable=False)
    stripe_count = Column(Integer, nullable=False, default=0)
    promotion_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_entries")


class TrainingGoal(Base):
    __tablename__ = "training_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False)
    title = Column(String(160), nullable=False)
    focus_area = Column(String(100), nullable=True)
    target_sessions = Column(Integer, nullable=True)
    target_rolling_rounds = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


class PersonalMilestone(Base):
    __tablename__ = "personal_milestones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    milestone_date = Column(Date, nullable=False)
    title = Column(String(160), nullable=False)
    category = Column(String(80), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="milestones")


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    competition_date = Column(Date, nullable=False)
    division = Column(String(120), nullable=True)
    weight_class = Column(String(80), nullable=True)
    result = Column(String(120), nullable=True)
    focus_plan = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="competitions")
