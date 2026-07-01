import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "body_part", label: "Body part", required: true },
  { name: "pain_level", label: "Pain level", type: "number", min: 0, max: 10, defaultValue: 1, required: true },
  { name: "cause", label: "Cause" },
  { name: "training_modification", label: "Training modification", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "resolved", label: "Resolved", type: "checkbox", defaultValue: false },
];

export default function Injuries() {
  return (
    <ResourceManager
      title="Injuries"
      eyebrow="Body check"
      description="Keep small warnings visible before they become long layoffs."
      resource="injuries"
      fields={fields}
      emptyText="No injuries logged. Good. Keep listening to your body."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.resolved ? "resolved" : "active"}</span>
              <h2>{item.body_part}</h2>
              <p>{item.training_modification || item.notes || item.cause || "No notes added."}</p>
            </div>
            <div className="metric-pill">{item.pain_level}/10</div>
          </div>
          <div className="tag-row">
            {item.cause && <span>{item.cause}</span>}
            <span>{item.resolved ? "resolved" : "monitor"}</span>
          </div>
        </>
      )}
    />
  );
}
