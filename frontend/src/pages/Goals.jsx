import { useMemo } from "react";

import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "month", label: "Month", placeholder: "YYYY-MM", required: true },
  { name: "title", label: "Goal", required: true },
  { name: "focus_area", label: "Focus area", placeholder: "Guard retention, cardio, passing..." },
  { name: "target_sessions", label: "Target sessions", type: "number", min: 0 },
  { name: "target_rolling_rounds", label: "Target rolling rounds", type: "number", min: 0 },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "completed", label: "Completed", type: "checkbox", defaultValue: false },
];

export default function Goals() {
  const initialValues = useMemo(
    () => ({ month: new Date().toISOString().slice(0, 7) }),
    []
  );

  return (
    <ResourceManager
      title="Goals"
      eyebrow="Monthly focus"
      description="Set the one thing this month should make clearer, sharper, or more durable."
      resource="goals"
      fields={fields}
      initialValues={initialValues}
      emptyText="No monthly goals yet. Pick one focus you can actually train."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.month}</span>
              <h2>{item.title}</h2>
              <p>{item.notes || item.focus_area || "No notes added."}</p>
            </div>
            <div className="metric-pill">{item.completed ? "Done" : "Active"}</div>
          </div>
          <div className="tag-row">
            {item.focus_area && <span>{item.focus_area}</span>}
            {item.target_sessions !== null && <span>{item.target_sessions} sessions</span>}
            {item.target_rolling_rounds !== null && <span>{item.target_rolling_rounds} rounds</span>}
          </div>
        </>
      )}
    />
  );
}
