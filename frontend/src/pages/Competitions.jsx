import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "name", label: "Competition", required: true },
  { name: "competition_date", label: "Date", type: "date", required: true },
  { name: "division", label: "Division" },
  { name: "weight_class", label: "Weight class" },
  { name: "result", label: "Result" },
  { name: "focus_plan", label: "Focus plan", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Competitions() {
  return (
    <ResourceManager
      title="Competitions"
      eyebrow="Competition mode"
      description="Track competition days, prep plans, divisions, and what came back from the bracket."
      resource="competitions"
      fields={fields}
      emptyText="No competitions logged yet."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.competition_date}</span>
              <h2>{item.name}</h2>
              <p>{item.result || item.focus_plan || item.notes || "No result or plan added."}</p>
            </div>
            <div className="metric-pill">{item.result ? "Result" : "Plan"}</div>
          </div>
          <div className="tag-row">
            {item.division && <span>{item.division}</span>}
            {item.weight_class && <span>{item.weight_class}</span>}
          </div>
        </>
      )}
    />
  );
}
