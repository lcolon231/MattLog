import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "session_id", label: "Session ID", type: "number", min: 1, placeholder: "Optional" },
  { name: "rounds_count", label: "Rounds count", type: "number", min: 1, defaultValue: 1, required: true },
  { name: "round_length_minutes", label: "Round length", type: "number", min: 1, defaultValue: 5, required: true },
  { name: "total_minutes", label: "Total minutes", type: "number", min: 1, placeholder: "Auto-calculated if blank" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Rolling() {
  return (
    <ResourceManager
      title="Rolling"
      eyebrow="Live rounds"
      description="Record sparring volume and notes from the rounds that shaped the session."
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
          </div>
        </>
      )}
    />
  );
}
