import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import ResourceManager from "../components/ResourceManager.jsx";

const milestoneFields = [
  { name: "milestone_date", label: "Date", type: "date", required: true },
  { name: "title", label: "Milestone", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: ["personal", "first class", "competition", "comeback", "breakthrough"],
    defaultValue: "personal",
    required: true,
  },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Timeline() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .timeline()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Progress story</span>
        <h1>Timeline</h1>
        <p>See the long arc: first class, promotions, injuries, competitions, and personal milestones.</p>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Athlete timeline</h2>
        </div>
        {error && <p className="error-message">{error}</p>}
        {!error && items.length === 0 && (
          <div className="empty-state">No timeline events yet. Add a milestone or log more training.</div>
        )}
        <div className="timeline-list">
          {items.map((item) => (
            <article className="timeline-item" key={item.id}>
              <span>{item.date}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail || item.type}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ResourceManager
        title="Milestones"
        eyebrow="Personal markers"
        description="Add the moments that do not fit neatly into belt or session logs."
        resource="milestones"
        fields={milestoneFields}
        emptyText="No personal milestones yet."
        renderItem={(item) => (
          <>
            <div className="card-main">
              <div>
                <span className="card-date">{item.milestone_date}</span>
                <h2>{item.title}</h2>
                <p>{item.notes || "No notes added."}</p>
              </div>
              <div className="metric-pill">{item.category}</div>
            </div>
          </>
        )}
      />
    </section>
  );
}
