import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "belt_rank", label: "Belt rank", type: "select", options: ["white", "blue", "purple", "brown", "black"], required: true },
  { name: "stripe_count", label: "Stripe count", type: "number", min: 0, max: 4, defaultValue: 0, required: true },
  { name: "promotion_date", label: "Promotion date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Progress() {
  return (
    <ResourceManager
      title="Progress"
      eyebrow="Rank history"
      description="Log belt and stripe changes with context you will want later."
      resource="progress"
      fields={fields}
      emptyText="No rank milestones yet."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.promotion_date || "No promotion date"}</span>
              <h2>{item.belt_rank} belt</h2>
              <p>{item.notes || "No notes added."}</p>
            </div>
            <div className="metric-pill">{item.stripe_count} stripes</div>
          </div>
        </>
      )}
    />
  );
}
