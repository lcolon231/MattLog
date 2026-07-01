import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client.js";

function buildCoachText(summary) {
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
        .map((technique) => `- ${technique.name} (${technique.category}, confidence ${technique.confidence_level}/5)`)
        .join("\n")
    : "- No recent techniques logged";

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

Active injuries:
${injuries}

Recent techniques:
${techniques}

Recent notes:
${notes}`;
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError("");
    setCopied(false);
    api
      .coachSummary(days)
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, [days]);

  const coachText = useMemo(() => buildCoachText(summary), [summary]);

  async function copySummary() {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(coachText);
      setCopied(true);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
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

          <section className="panel report-panel">
            <div className="panel-heading">
              <h2>Coach summary</h2>
              <button className="primary-button compact" type="button" onClick={copySummary}>
                Copy summary
              </button>
            </div>
            {copied && <p className="success-message">Copied summary to clipboard.</p>}
            <pre className="report-preview">{coachText}</pre>
          </section>
        </>
      )}
    </section>
  );
}
