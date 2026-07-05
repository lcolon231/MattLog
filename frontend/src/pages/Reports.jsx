import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client.js";

function buildSubmissionLines(stats) {
  if (!stats || (stats.total_landed === 0 && stats.total_conceded === 0)) {
    return "- No submissions logged";
  }

  const topLanded = stats.top_landed.length
    ? stats.top_landed.map((entry) => `${entry.technique_name} x${entry.count}`).join(", ")
    : "none";
  const topConceded = stats.top_conceded.length
    ? stats.top_conceded.map((entry) => `${entry.technique_name} x${entry.count}`).join(", ")
    : "none";

  return `- ${stats.total_landed} landed, ${stats.total_conceded} conceded
- Landing most: ${topLanded}
- Getting caught by: ${topConceded}`;
}

function buildCoachText(summary, submissionStats) {
  if (!summary) {
    return "";
  }

  const injuries = summary.active_injuries.length
    ? summary.active_injuries
        .map(
          (injury) =>
            `- ${injury.body_part}: pain ${injury.pain_level}/10${
              injury.training_modification ? `, modify: ${injury.training_modification}` : ""
            }`
        )
        .join("\n")
    : "- No active injuries logged";

  const techniques = summary.recent_techniques.length
    ? summary.recent_techniques
        .map((technique) => `- ${technique.name} (${technique.category}, ${technique.progress_stage})`)
        .join("\n")
    : "- No recent techniques logged";
  const competitions = summary.competitions.length
    ? summary.competitions
        .map((competition) => `- ${competition.competition_date}: ${competition.name}${competition.result ? `, ${competition.result}` : ""}`)
        .join("\n")
    : "- No competition days in this range";

  const notes = summary.recent_notes.length
    ? summary.recent_notes.map((note) => `- ${note}`).join("\n")
    : "- No recent notes logged";

  return `MatLog coach summary
Date range: ${summary.date_range}
Rank: ${summary.belt_rank} belt, ${summary.stripe_count} stripe${summary.stripe_count === 1 ? "" : "s"}

Training:
- ${summary.total_sessions} sessions
- ${summary.total_training_minutes} training minutes
- ${summary.total_rolling_rounds} rolling rounds
- ${summary.total_rolling_minutes} rolling minutes

Submissions:
${buildSubmissionLines(submissionStats)}

Active injuries:
${injuries}

Goal of the month:
- ${summary.goal_of_month ? `${summary.goal_of_month.title} (${summary.goal_of_month.focus_area || "general"})` : "No monthly goal set"}

Recent techniques:
${techniques}

Competition days:
${competitions}

Recent notes:
${notes}`;
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [submissionStats, setSubmissionStats] = useState(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError("");
    setCopied(false);
    Promise.all([api.coachSummary(days), api.submissionStats(days)])
      .then(([nextSummary, nextStats]) => {
        setSummary(nextSummary);
        setSubmissionStats(nextStats);
      })
      .catch((err) => setError(err.message));
  }, [days]);

  const coachText = useMemo(
    () => buildCoachText(summary, submissionStats),
    [submissionStats, summary]
  );

  async function copySummary() {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(coachText);
      setCopied(true);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  async function downloadCsv() {
    setError("");
    try {
      await api.downloadCoachCsv(days);
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadPdf() {
    setError("");
    try {
      await api.downloadCoachPdf(days);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading with-action">
        <div>
          <span>Coach report</span>
          <h1>Reports</h1>
          <p>Bring a clear snapshot of training load, injuries, and recent focus to your coach.</p>
        </div>
        <label className="compact-control">
          Range
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}
      {!summary && !error && <div className="loading-panel">Loading report...</div>}

      {summary && (
        <>
          <section className="stat-grid">
            <div className="stat-card">
              <span>Sessions</span>
              <strong>{summary.total_sessions}</strong>
              <small>{summary.date_range}</small>
            </div>
            <div className="stat-card">
              <span>Training minutes</span>
              <strong>{summary.total_training_minutes}</strong>
              <small>Class time</small>
            </div>
            <div className="stat-card">
              <span>Rolling rounds</span>
              <strong>{summary.total_rolling_rounds}</strong>
              <small>{summary.total_rolling_minutes} minutes</small>
            </div>
            <div className="stat-card">
              <span>Rank</span>
              <strong>{summary.belt_rank}</strong>
              <small>{summary.stripe_count} stripes</small>
            </div>
          </section>

          {submissionStats && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Submission game</h2>
              </div>
              <section className="stat-grid">
                <div className="stat-card">
                  <span>Landed</span>
                  <strong>{submissionStats.total_landed}</strong>
                  <small>
                    {submissionStats.top_landed.length
                      ? `Best: ${submissionStats.top_landed[0].technique_name}`
                      : "No submissions landed yet"}
                  </small>
                </div>
                <div className="stat-card">
                  <span>Conceded</span>
                  <strong>{submissionStats.total_conceded}</strong>
                  <small>
                    {submissionStats.top_conceded.length
                      ? `Watch out for: ${submissionStats.top_conceded[0].technique_name}`
                      : "Nothing catching you yet"}
                  </small>
                </div>
              </section>
              {submissionStats.by_opponent_belt.length > 0 && (
                <div className="tag-row">
                  {submissionStats.by_opponent_belt.map((entry) => (
                    <span key={entry.opponent_belt_rank}>
                      vs {entry.opponent_belt_rank}: {entry.landed} landed / {entry.conceded} conceded
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="panel report-panel">
            <div className="panel-heading">
              <h2>Coach summary</h2>
              <div className="button-row">
                <button className="ghost-button compact" type="button" onClick={downloadCsv}>
                  CSV
                </button>
                <button className="ghost-button compact" type="button" onClick={downloadPdf}>
                  PDF
                </button>
                <button className="primary-button compact" type="button" onClick={copySummary}>
                  Copy summary
                </button>
              </div>
            </div>
            {copied && <p className="success-message">Copied summary to clipboard.</p>}
            <pre className="report-preview">{coachText}</pre>
          </section>
        </>
      )}
    </section>
  );
}
