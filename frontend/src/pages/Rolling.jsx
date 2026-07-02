import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "session_id", label: "Session ID", type: "number", min: 1, placeholder: "Optional" },
  { name: "rounds_count", label: "Rounds count", type: "number", min: 1, defaultValue: 1, required: true },
  { name: "round_length_minutes", label: "Round length", type: "number", min: 1, defaultValue: 5, required: true },
  { name: "total_minutes", label: "Total minutes", type: "number", min: 1, placeholder: "Auto-calculated if blank" },
  { name: "submissions_hit", label: "Submissions hit", type: "number", min: 0, defaultValue: 0 },
  { name: "submissions_conceded", label: "Submissions conceded", type: "number", min: 0, defaultValue: 0 },
  { name: "positions_won", label: "Positions won", type: "number", min: 0, defaultValue: 0 },
  { name: "positions_lost", label: "Positions lost", type: "number", min: 0, defaultValue: 0 },
  {
    name: "partner_belt_rank",
    label: "Partner belt",
    type: "select",
    options: ["white", "blue", "purple", "brown", "black", "mixed"],
  },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Rolling() {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    api
      .rollingWeeklyStats()
      .then(setWeeklyStats)
      .catch((err) => setStatsError(err.message));
  }, []);

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>Rolling stats by week</h2>
        </div>
        {statsError && <p className="error-message">{statsError}</p>}
        <div className="week-strip">
          {weeklyStats.map((week) => (
            <div className="week-cell" key={week.week_start}>
              <span>{week.week_start}</span>
              <strong>{week.rounds_count}</strong>
              <small>
                {week.total_minutes} min / +{week.submissions_hit} subs / -{week.submissions_conceded}
              </small>
            </div>
          ))}
          {!statsError && weeklyStats.length === 0 && (
            <div className="empty-state">No rolling stats yet.</div>
          )}
        </div>
      </section>

      <ResourceManager
        title="Rolling"
        eyebrow="Live rounds"
        description="Record sparring volume, outcomes, partner level, and notes from the rounds that shaped the session."
        resource="rolling"
        fields={fields}
        emptyText="No rolling rounds logged yet."
        renderItem={(item) => (
          <>
            <div className="card-main">
              <div>
                <span className="card-date">Session {item.session_id || "unlinked"}</span>
                <h2>{item.rounds_count} rounds</h2>
                <p>{item.notes || "No round notes added."}</p>
              </div>
              <div className="metric-pill">{item.total_minutes} min</div>
            </div>
            <div className="tag-row">
              <span>{item.round_length_minutes} min rounds</span>
              <span>{item.submissions_hit} subs hit</span>
              <span>{item.submissions_conceded} conceded</span>
              <span>{item.positions_won} positions won</span>
              <span>{item.positions_lost} lost</span>
              {item.partner_belt_rank && <span>{item.partner_belt_rank} belt partner</span>}
            </div>
          </>
        )}
      />
    </section>
  );
}
