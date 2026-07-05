from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    belt_rank: str = "white"
    stripe_count: int = Field(default=0, ge=0, le=4)
    academy_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    belt_rank: Optional[str] = None
    stripe_count: Optional[int] = Field(default=None, ge=0, le=4)
    academy_name: Optional[str] = None


class UserRead(ORMModel, UserBase):
    id: int
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TrainingSessionBase(BaseModel):
    date: date
    class_type: str
    duration_minutes: int = Field(gt=0)
    intensity: str
    techniques_learned: Optional[str] = None
    notes: Optional[str] = None
    felt_dizzy: bool = False
    fasted_before_training: bool = False


class TrainingSessionCreate(TrainingSessionBase):
    pass


class TrainingSessionUpdate(BaseModel):
    date: Optional[date] = None
    class_type: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    intensity: Optional[str] = None
    techniques_learned: Optional[str] = None
    notes: Optional[str] = None
    felt_dizzy: Optional[bool] = None
    fasted_before_training: Optional[bool] = None


class TrainingSessionRead(ORMModel, TrainingSessionBase):
    id: int
    user_id: int
    created_at: datetime


class RollingRoundBase(BaseModel):
    session_id: Optional[int] = None
    rounds_count: int = Field(gt=0)
    round_length_minutes: int = Field(gt=0)
    total_minutes: Optional[int] = Field(default=None, gt=0)
    submissions_hit: int = Field(default=0, ge=0)
    submissions_conceded: int = Field(default=0, ge=0)
    positions_won: int = Field(default=0, ge=0)
    positions_lost: int = Field(default=0, ge=0)
    partner_belt_rank: Optional[str] = None
    notes: Optional[str] = None


class RollingRoundCreate(RollingRoundBase):
    pass


class RollingRoundUpdate(BaseModel):
    session_id: Optional[int] = None
    rounds_count: Optional[int] = Field(default=None, gt=0)
    round_length_minutes: Optional[int] = Field(default=None, gt=0)
    total_minutes: Optional[int] = Field(default=None, gt=0)
    submissions_hit: Optional[int] = Field(default=None, ge=0)
    submissions_conceded: Optional[int] = Field(default=None, ge=0)
    positions_won: Optional[int] = Field(default=None, ge=0)
    positions_lost: Optional[int] = Field(default=None, ge=0)
    partner_belt_rank: Optional[str] = None
    notes: Optional[str] = None


class RollingRoundRead(ORMModel):
    id: int
    user_id: int
    session_id: Optional[int] = None
    rounds_count: int
    round_length_minutes: int
    total_minutes: int
    submissions_hit: int
    submissions_conceded: int
    positions_won: int
    positions_lost: int
    partner_belt_rank: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class SubmissionBase(BaseModel):
    rolling_round_id: Optional[int] = None
    technique_name: str = Field(min_length=1, max_length=160)
    result: Literal["landed", "conceded"]
    opponent_belt_rank: Optional[str] = None
    count: int = Field(default=1, ge=1)
    notes: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionUpdate(BaseModel):
    rolling_round_id: Optional[int] = None
    technique_name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    result: Optional[Literal["landed", "conceded"]] = None
    opponent_belt_rank: Optional[str] = None
    count: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = None


class SubmissionRead(ORMModel, SubmissionBase):
    id: int
    user_id: int
    created_at: datetime


class TechniqueBase(BaseModel):
    name: str
    category: str
    gi_or_nogi: str
    confidence_level: int = Field(default=1, ge=1, le=5)
    progress_stage: str = "Learning"
    needs_reps: bool = True
    revisit_on: Optional[date] = None
    notes: Optional[str] = None
    last_practiced: Optional[date] = None


class TechniqueCreate(TechniqueBase):
    pass


class TechniqueUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    gi_or_nogi: Optional[str] = None
    confidence_level: Optional[int] = Field(default=None, ge=1, le=5)
    progress_stage: Optional[str] = None
    needs_reps: Optional[bool] = None
    revisit_on: Optional[date] = None
    notes: Optional[str] = None
    last_practiced: Optional[date] = None


class TechniqueRead(ORMModel, TechniqueBase):
    id: int
    user_id: int
    created_at: datetime


class InjuryBase(BaseModel):
    session_id: Optional[int] = None
    body_part: str
    pain_level: int = Field(ge=0, le=10)
    cause: Optional[str] = None
    notes: Optional[str] = None
    training_modification: Optional[str] = None
    resolved: bool = False


class InjuryCreate(InjuryBase):
    pass


class InjuryUpdate(BaseModel):
    session_id: Optional[int] = None
    body_part: Optional[str] = None
    pain_level: Optional[int] = Field(default=None, ge=0, le=10)
    cause: Optional[str] = None
    notes: Optional[str] = None
    training_modification: Optional[str] = None
    resolved: Optional[bool] = None


class InjuryRead(ORMModel, InjuryBase):
    id: int
    user_id: int
    created_at: datetime


class BeltProgressBase(BaseModel):
    belt_rank: str
    stripe_count: int = Field(default=0, ge=0, le=4)
    promotion_date: Optional[date] = None
    notes: Optional[str] = None


class BeltProgressCreate(BeltProgressBase):
    pass


class BeltProgressUpdate(BaseModel):
    belt_rank: Optional[str] = None
    stripe_count: Optional[int] = Field(default=None, ge=0, le=4)
    promotion_date: Optional[date] = None
    notes: Optional[str] = None


class BeltProgressRead(ORMModel, BeltProgressBase):
    id: int
    user_id: int
    created_at: datetime


class TrainingGoalBase(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    title: str
    focus_area: Optional[str] = None
    target_sessions: Optional[int] = Field(default=None, ge=0)
    target_rolling_rounds: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    completed: bool = False


class TrainingGoalCreate(TrainingGoalBase):
    pass


class TrainingGoalUpdate(BaseModel):
    month: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    title: Optional[str] = None
    focus_area: Optional[str] = None
    target_sessions: Optional[int] = Field(default=None, ge=0)
    target_rolling_rounds: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    completed: Optional[bool] = None


class TrainingGoalRead(ORMModel, TrainingGoalBase):
    id: int
    user_id: int
    created_at: datetime


class PersonalMilestoneBase(BaseModel):
    milestone_date: date
    title: str
    category: str = "personal"
    notes: Optional[str] = None


class PersonalMilestoneCreate(PersonalMilestoneBase):
    pass


class PersonalMilestoneUpdate(BaseModel):
    milestone_date: Optional[date] = None
    title: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class PersonalMilestoneRead(ORMModel, PersonalMilestoneBase):
    id: int
    user_id: int
    created_at: datetime


class CompetitionBase(BaseModel):
    name: str
    competition_date: date
    division: Optional[str] = None
    weight_class: Optional[str] = None
    result: Optional[str] = None
    focus_plan: Optional[str] = None
    notes: Optional[str] = None


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    competition_date: Optional[date] = None
    division: Optional[str] = None
    weight_class: Optional[str] = None
    result: Optional[str] = None
    focus_plan: Optional[str] = None
    notes: Optional[str] = None


class CompetitionRead(ORMModel, CompetitionBase):
    id: int
    user_id: int
    created_at: datetime


class DashboardStats(BaseModel):
    total_sessions: int
    total_training_minutes: int
    total_training_hours: float
    total_rolling_rounds: int
    total_rolling_minutes: int
    current_belt: str
    current_stripes: int
    most_recent_session: Optional[TrainingSessionRead] = None
    sessions_this_week: int


class DashboardInjuryAlert(ORMModel):
    id: int
    body_part: str
    pain_level: int
    training_modification: Optional[str] = None
    session_id: Optional[int] = None
    created_at: datetime


class TrainingLoadSummary(BaseModel):
    sessions_this_week: int
    sessions_last_week: int
    training_minutes_this_week: int
    training_minutes_last_week: int
    rolling_minutes_this_week: int
    rolling_minutes_last_week: int
    rolling_rounds_this_week: int
    rolling_rounds_last_week: int
    training_minutes_change_percent: Optional[float] = None
    rolling_minutes_change_percent: Optional[float] = None
    warning_message: Optional[str] = None


class SubmissionTechniqueCount(BaseModel):
    technique_name: str
    count: int


class SubmissionBeltBreakdown(BaseModel):
    opponent_belt_rank: str
    landed: int
    conceded: int


class SubmissionStats(BaseModel):
    date_range: str
    total_landed: int
    total_conceded: int
    top_landed: list[SubmissionTechniqueCount]
    top_conceded: list[SubmissionTechniqueCount]
    by_opponent_belt: list[SubmissionBeltBreakdown]


class CoachSummary(BaseModel):
    date_range: str
    total_sessions: int
    total_training_minutes: int
    total_rolling_rounds: int
    total_rolling_minutes: int
    active_injuries: list[DashboardInjuryAlert]
    recent_techniques: list[TechniqueRead]
    recent_notes: list[str]
    goal_of_month: Optional[TrainingGoalRead] = None
    competitions: list[CompetitionRead] = Field(default_factory=list)
    belt_rank: str
    stripe_count: int


class TimelineItem(BaseModel):
    id: str
    date: date
    type: str
    title: str
    detail: Optional[str] = None


class RollingWeeklyStats(BaseModel):
    week_start: date
    rounds_count: int
    total_minutes: int
    submissions_hit: int
    submissions_conceded: int
    positions_won: int
    positions_lost: int
