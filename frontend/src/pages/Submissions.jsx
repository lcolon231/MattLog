import ResourceManager from "../components/ResourceManager.jsx";

const beltOptions = ["white", "blue", "purple", "brown", "black"];

const fields = [
  { name: "technique_name", label: "Technique", type: "text", required: true, placeholder: "e.g. Rear naked choke" },
  { name: "result", label: "Result", type: "select", options: ["landed", "conceded"], required: true },
  { name: "opponent_belt_rank", label: "Opponent belt", type: "select", options: beltOptions },
  { name: "count", label: "Times", type: "number", min: 1, defaultValue: 1, required: true },
  { name: "rolling_round_id", label: "Rolling round ID", type: "number", min: 1, placeholder: "Optional" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Submissions() {
  return (
    <ResourceManager
      title="Submissions"
      eyebrow="Rolling outcomes"
      description="Track what you land and what catches you, so patterns show up before the next roll."
      resource="submissions"
      fields={fields}
      formNote="Link a rolling round ID to tie submissions to a specific day of sparring."
      emptyText="No submissions logged yet."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">
                {item.result === "landed" ? "Landed" : "Conceded"}
                {item.opponent_belt_rank ? ` vs ${item.opponent_belt_rank} belt` : ""}
              </span>
              <h2>{item.technique_name}</h2>
              <p>{item.notes || "No submission notes added."}</p>
            </div>
            <div className="metric-pill">x{item.count}</div>
          </div>
          <div className="tag-row">
            <span>{item.result}</span>
            {item.opponent_belt_rank && <span>{item.opponent_belt_rank} belt</span>}
            <span>Round {item.rolling_round_id || "unlinked"}</span>
          </div>
        </>
      )}
    />
  );
}
