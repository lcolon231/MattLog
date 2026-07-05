import csv
from collections import Counter
from datetime import date, timedelta
from io import StringIO

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import (
    BeltProgress,
    Competition,
    Injury,
    PersonalMilestone,
    RollingRound,
    Submission,
    Technique,
    TrainingGoal,
    TrainingSession,
    User,
)
from ..schemas import CoachSummary, SubmissionStats, TimelineItem

router = APIRouter(prefix="/reports", tags=["reports"])


def rolling_date(round_entry: RollingRound):
    if round_entry.session:
        return round_entry.session.date
    return round_entry.created_at.date()


def get_summary_data(days: int, db: Session, current_user: User):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    sessions = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.user_id == current_user.id,
            TrainingSession.date >= start_date,
            TrainingSession.date <= end_date,
        )
        .order_by(TrainingSession.date.desc(), TrainingSession.created_at.desc())
        .all()
    )
    rolling_rounds = (
        db.query(RollingRound)
        .filter(RollingRound.user_id == current_user.id)
        .all()
    )

    recent_rolling = [
        round_entry
        for round_entry in rolling_rounds
        if start_date <= rolling_date(round_entry) <= end_date
    ]
    active_injuries = (
        db.query(Injury)
        .filter(Injury.user_id == current_user.id, Injury.resolved.is_(False))
        .order_by(Injury.pain_level.desc(), Injury.created_at.desc())
        .all()
    )
    recent_techniques = (
        db.query(Technique)
        .filter(Technique.user_id == current_user.id)
        .order_by(Technique.last_practiced.desc().nullslast(), Technique.created_at.desc())
        .limit(8)
        .all()
    )
    month = end_date.strftime("%Y-%m")
    goal_of_month = (
        db.query(TrainingGoal)
        .filter(TrainingGoal.user_id == current_user.id, TrainingGoal.month == month)
        .order_by(TrainingGoal.created_at.desc())
        .first()
    )
    competitions = (
        db.query(Competition)
        .filter(
            Competition.user_id == current_user.id,
            Competition.competition_date >= start_date,
            Competition.competition_date <= end_date,
        )
        .order_by(Competition.competition_date.desc(), Competition.created_at.desc())
        .all()
    )
    recent_notes = [
        note
        for session in sessions[:8]
        for note in (session.techniques_learned, session.notes)
        if note
    ][:8]

    return {
        "date_range": f"{start_date.isoformat()} to {end_date.isoformat()}",
        "total_sessions": len(sessions),
        "total_training_minutes": sum(session.duration_minutes for session in sessions),
        "total_rolling_rounds": sum(round_entry.rounds_count for round_entry in recent_rolling),
        "total_rolling_minutes": sum(round_entry.total_minutes for round_entry in recent_rolling),
        "active_injuries": active_injuries,
        "recent_techniques": recent_techniques,
        "recent_notes": recent_notes,
        "goal_of_month": goal_of_month,
        "competitions": competitions,
        "belt_rank": current_user.belt_rank,
        "stripe_count": current_user.stripe_count,
    }


def build_summary_text(summary: dict) -> str:
    injuries = summary["active_injuries"]
    techniques = summary["recent_techniques"]
    competitions = summary["competitions"]
    notes = summary["recent_notes"]
    goal = summary["goal_of_month"]

    injury_lines = [
        f"- {injury.body_part}: pain {injury.pain_level}/10"
        f"{', modify: ' + injury.training_modification if injury.training_modification else ''}"
        for injury in injuries
    ] or ["- No active injuries logged"]
    technique_lines = [
        f"- {technique.name} ({technique.progress_stage}, {technique.category})"
        for technique in techniques
    ] or ["- No recent techniques logged"]
    competition_lines = [
        f"- {competition.competition_date}: {competition.name}"
        f"{' - ' + competition.result if competition.result else ''}"
        for competition in competitions
    ] or ["- No competition days in this range"]
    note_lines = [f"- {note}" for note in notes] or ["- No recent notes logged"]

    return "\n".join(
        [
            "MatLog coach summary",
            f"Date range: {summary['date_range']}",
            f"Rank: {summary['belt_rank']} belt, {summary['stripe_count']} stripes",
            "",
            "Training:",
            f"- {summary['total_sessions']} sessions",
            f"- {summary['total_training_minutes']} training minutes",
            f"- {summary['total_rolling_rounds']} rolling rounds",
            f"- {summary['total_rolling_minutes']} rolling minutes",
            "",
            "Goal of the month:",
            f"- {goal.title} ({goal.focus_area or 'general'})" if goal else "- No monthly goal set",
            "",
            "Active injuries:",
            *injury_lines,
            "",
            "Recent techniques:",
            *technique_lines,
            "",
            "Competition days:",
            *competition_lines,
            "",
            "Recent notes:",
            *note_lines,
        ]
    )


def pdf_from_text(text: str) -> bytes:
    def escape_pdf(value: str) -> str:
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    lines = text.splitlines()
    content_lines = ["BT", "/F1 11 Tf", "48 780 Td", "14 TL"]
    for index, line in enumerate(lines[:52]):
        if index:
            content_lines.append("T*")
        content_lines.append(f"({escape_pdf(line[:92])}) Tj")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = b"%PDF-1.4\n"
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{index} 0 obj\n".encode("ascii") + obj + b"\nendobj\n"
    xref_offset = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii")
    for offset in offsets:
        pdf += f"{offset:010d} 00000 n \n".encode("ascii")
    pdf += (
        b"trailer\n"
        + f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode("ascii")
        + b"startxref\n"
        + str(xref_offset).encode("ascii")
        + b"\n%%EOF\n"
    )
    return pdf


@router.get("/coach-summary", response_model=CoachSummary)
def get_coach_summary(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_summary_data(days, db, current_user)


@router.get("/coach-summary.csv")
def export_coach_summary_csv(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_summary_data(days, db, current_user)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["section", "label", "value"])
    writer.writerow(["summary", "date_range", summary["date_range"]])
    writer.writerow(["summary", "total_sessions", summary["total_sessions"]])
    writer.writerow(["summary", "total_training_minutes", summary["total_training_minutes"]])
    writer.writerow(["summary", "total_rolling_rounds", summary["total_rolling_rounds"]])
    writer.writerow(["summary", "total_rolling_minutes", summary["total_rolling_minutes"]])
    writer.writerow(["rank", "belt", summary["belt_rank"]])
    writer.writerow(["rank", "stripes", summary["stripe_count"]])
    if summary["goal_of_month"]:
        writer.writerow(["goal", "title", summary["goal_of_month"].title])
        writer.writerow(["goal", "focus_area", summary["goal_of_month"].focus_area or ""])
    for injury in summary["active_injuries"]:
        writer.writerow(["injury", injury.body_part, f"pain {injury.pain_level}/10"])
    for technique in summary["recent_techniques"]:
        writer.writerow(["technique", technique.name, technique.progress_stage])
    for competition in summary["competitions"]:
        writer.writerow(["competition", competition.name, competition.competition_date.isoformat()])
    for note in summary["recent_notes"]:
        writer.writerow(["note", "", note])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="matlog-coach-summary.csv"'},
    )


@router.get("/coach-summary.pdf")
def export_coach_summary_pdf(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_summary_data(days, db, current_user)
    pdf = pdf_from_text(build_summary_text(summary))
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="matlog-coach-summary.pdf"'},
    )


@router.get("/timeline", response_model=list[TimelineItem])
def get_timeline(
    days: int = Query(default=365, ge=1, le=3650),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    items = []

    first_session = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == current_user.id)
        .order_by(TrainingSession.date.asc(), TrainingSession.created_at.asc())
        .first()
    )
    if first_session and start_date <= first_session.date <= end_date:
        items.append(
            {
                "id": f"first-class-{first_session.id}",
                "date": first_session.date,
                "type": "first_class",
                "title": "First class logged",
                "detail": first_session.class_type,
            }
        )

    for progress in (
        db.query(BeltProgress)
        .filter(BeltProgress.user_id == current_user.id)
        .all()
    ):
        item_date = progress.promotion_date or progress.created_at.date()
        if start_date <= item_date <= end_date:
            items.append(
                {
                    "id": f"promotion-{progress.id}",
                    "date": item_date,
                    "type": "promotion",
                    "title": f"{progress.belt_rank} belt, {progress.stripe_count} stripes",
                    "detail": progress.notes,
                }
            )

    for injury in (
        db.query(Injury)
        .filter(Injury.user_id == current_user.id)
        .all()
    ):
        item_date = injury.created_at.date()
        if start_date <= item_date <= end_date:
            items.append(
                {
                    "id": f"injury-{injury.id}",
                    "date": item_date,
                    "type": "injury",
                    "title": f"{injury.body_part} injury",
                    "detail": f"Pain {injury.pain_level}/10",
                }
            )

    for competition in (
        db.query(Competition)
        .filter(Competition.user_id == current_user.id)
        .all()
    ):
        if start_date <= competition.competition_date <= end_date:
            items.append(
                {
                    "id": f"competition-{competition.id}",
                    "date": competition.competition_date,
                    "type": "competition",
                    "title": competition.name,
                    "detail": competition.result or competition.focus_plan,
                }
            )

    for milestone in (
        db.query(PersonalMilestone)
        .filter(PersonalMilestone.user_id == current_user.id)
        .all()
    ):
        if start_date <= milestone.milestone_date <= end_date:
            items.append(
                {
                    "id": f"milestone-{milestone.id}",
                    "date": milestone.milestone_date,
                    "type": milestone.category,
                    "title": milestone.title,
                    "detail": milestone.notes,
                }
            )

    return sorted(items, key=lambda item: item["date"], reverse=True)


@router.get("/submission-stats", response_model=SubmissionStats)
def get_submission_stats(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    submissions = (
        db.query(Submission)
        .filter(Submission.user_id == current_user.id)
        .all()
    )

    def submission_date(submission: Submission):
        if submission.rolling_round and submission.rolling_round.session:
            return submission.rolling_round.session.date
        return submission.created_at.date()

    recent = [
        submission
        for submission in submissions
        if start_date <= submission_date(submission) <= end_date
    ]
    landed = [submission for submission in recent if submission.result == "landed"]
    conceded = [submission for submission in recent if submission.result == "conceded"]

    def top_techniques(entries: list[Submission], limit: int = 5):
        counts = Counter()
        for entry in entries:
            counts[entry.technique_name.strip()] += entry.count
        return [
            {"technique_name": name, "count": count}
            for name, count in counts.most_common(limit)
        ]

    belt_breakdown: dict[str, dict[str, int]] = {}
    for entry in recent:
        belt = entry.opponent_belt_rank or "unknown"
        bucket = belt_breakdown.setdefault(belt, {"landed": 0, "conceded": 0})
        bucket[entry.result] += entry.count

    return {
        "date_range": f"{start_date.isoformat()} to {end_date.isoformat()}",
        "total_landed": sum(entry.count for entry in landed),
        "total_conceded": sum(entry.count for entry in conceded),
        "top_landed": top_techniques(landed),
        "top_conceded": top_techniques(conceded),
        "by_opponent_belt": [
            {
                "opponent_belt_rank": belt,
                "landed": bucket["landed"],
                "conceded": bucket["conceded"],
            }
            for belt, bucket in sorted(
                belt_breakdown.items(),
                key=lambda item: item[1]["landed"] + item[1]["conceded"],
                reverse=True,
            )
        ],
    }
