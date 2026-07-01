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
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="rolling_rounds")
    session = relationship("TrainingSession", back_populates="rolling_rounds")


class Technique(Base):
    __tablename__ = "techniques"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    category = Column(String(80), nullable=False)
    gi_or_nogi = Column(String(20), nullable=False)
    confidence_level = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    last_practiced = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="techniques")


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
