import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "name", label: "Name", required: true },
  { name: "category", label: "Category", required: true, placeholder: "Guard pass, sweep, escape..." },
  { name: "gi_or_nogi", label: "Gi or no-gi", type: "select", options: ["gi", "no-gi", "both"], required: true },
  { name: "confidence_level", label: "Confidence", type: "number", min: 1, max: 5, defaultValue: 1, required: true },
  { name: "last_practiced", label: "Last practiced", type: "date" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Techniques() {
  return (
    <ResourceManager
      title="Techniques"
      eyebrow="Skill library"
      description="Track what you are learning and how confident it feels under pressure."
      resource="techniques"
      fields={fields}
      emptyText="No techniques saved yet. Add the move you worked today."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.last_practiced || "Not practiced yet"}</span>
              <h2>{item.name}</h2>
              <p>{item.notes || "No notes added."}</p>
            </div>
            <div className="metric-pill">{item.confidence_level}/5</div>
          </div>
          <div className="tag-row">
            <span>{item.category}</span>
            <span>{item.gi_or_nogi}</span>
          </div>
        </>
      )}
    />
  );
}
