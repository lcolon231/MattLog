import { useCallback, useState } from "react";

import ResourceManager from "../components/ResourceManager.jsx";

const fields = [
  { name: "name", label: "Name", required: true },
  { name: "category", label: "Category", required: true, placeholder: "Guard pass, sweep, escape..." },
  { name: "gi_or_nogi", label: "Gi or no-gi", type: "select", options: ["gi", "no-gi", "both"], required: true },
  {
    name: "progress_stage",
    label: "Stage",
    type: "select",
    options: ["Learning", "Drilling", "Live-tested", "Reliable"],
    defaultValue: "Learning",
    required: true,
  },
  { name: "needs_reps", label: "Needs reps", type: "checkbox", defaultValue: true },
  { name: "revisit_on", label: "Revisit on", type: "date" },
  { name: "confidence_level", label: "Confidence", type: "number", min: 1, max: 5, defaultValue: 1, required: true },
  { name: "last_practiced", label: "Last practiced", type: "date" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Techniques() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    gi_or_nogi: "",
    progress_stage: "",
    needs_reps: false,
    sort: "needs_reps",
  });

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const filterItems = useCallback(
    (item) => {
      const search = filters.search.trim().toLowerCase();
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        (item.notes || "").toLowerCase().includes(search);
      const matchesCategory =
        !filters.category ||
        item.category.toLowerCase().includes(filters.category.trim().toLowerCase());
      const matchesGi = !filters.gi_or_nogi || item.gi_or_nogi === filters.gi_or_nogi;
      const matchesStage = !filters.progress_stage || item.progress_stage === filters.progress_stage;
      const matchesNeedsReps = !filters.needs_reps || item.needs_reps;

      return matchesSearch && matchesCategory && matchesGi && matchesStage && matchesNeedsReps;
    },
    [filters]
  );
  const sortItems = useCallback(
    (items) =>
      [...items].sort((a, b) => {
        if (filters.sort === "needs_reps") {
          return Number(b.needs_reps) - Number(a.needs_reps) || a.name.localeCompare(b.name);
        }
        if (filters.sort === "revisit") {
          return (a.revisit_on || "9999-12-31").localeCompare(b.revisit_on || "9999-12-31");
        }
        if (filters.sort === "stage") {
          const stageOrder = ["Learning", "Drilling", "Live-tested", "Reliable"];
          return stageOrder.indexOf(a.progress_stage) - stageOrder.indexOf(b.progress_stage);
        }
        return a.name.localeCompare(b.name);
      }),
    [filters.sort]
  );

  return (
    <ResourceManager
      title="Techniques"
      eyebrow="Skill library"
      description="Track what you are learning and how confident it feels under pressure."
      resource="techniques"
      fields={fields}
      filters={
        <section className="panel filter-panel">
          <label className="wide-field">
            Search techniques
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Name or notes"
            />
          </label>
          <label>
            Category
            <input
              name="category"
              value={filters.category}
              onChange={updateFilter}
              placeholder="Guard, pass, sweep..."
            />
          </label>
          <label>
            Gi / no-gi
            <select name="gi_or_nogi" value={filters.gi_or_nogi} onChange={updateFilter}>
              <option value="">All</option>
              <option value="gi">gi</option>
              <option value="no-gi">no-gi</option>
              <option value="both">both</option>
            </select>
          </label>
          <label>
            Stage
            <select name="progress_stage" value={filters.progress_stage} onChange={updateFilter}>
              <option value="">All</option>
              <option value="Learning">Learning</option>
              <option value="Drilling">Drilling</option>
              <option value="Live-tested">Live-tested</option>
              <option value="Reliable">Reliable</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" value={filters.sort} onChange={updateFilter}>
              <option value="needs_reps">Needs reps first</option>
              <option value="revisit">Revisit date</option>
              <option value="stage">Stage</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              name="needs_reps"
              type="checkbox"
              checked={filters.needs_reps}
              onChange={updateFilter}
            />
            <span>Needs reps only</span>
          </label>
        </section>
      }
      filterItems={filterItems}
      sortItems={sortItems}
      filteredEmptyText="No techniques match those filters."
      emptyText="No techniques saved yet. Add the move you worked today."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.last_practiced || "Not practiced yet"}</span>
              <h2>{item.name}</h2>
              <p>{item.notes || (item.needs_reps ? "Needs more live reps." : "No notes added.")}</p>
            </div>
            <div className="metric-pill">{item.progress_stage || "Learning"}</div>
          </div>
          <div className="tag-row">
            <span>{item.category}</span>
            <span>{item.gi_or_nogi}</span>
            {item.needs_reps && <span>needs reps</span>}
            {item.revisit_on && <span>revisit {item.revisit_on}</span>}
          </div>
        </>
      )}
    />
  );
}
