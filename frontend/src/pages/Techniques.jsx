import { useCallback, useState } from "react";

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
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    gi_or_nogi: "",
    confidence_level: "",
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
      const matchesConfidence =
        !filters.confidence_level ||
        item.confidence_level === Number(filters.confidence_level);

      return matchesSearch && matchesCategory && matchesGi && matchesConfidence;
    },
    [filters]
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
            Confidence
            <select name="confidence_level" value={filters.confidence_level} onChange={updateFilter}>
              <option value="">All</option>
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </select>
          </label>
        </section>
      }
      filterItems={filterItems}
      filteredEmptyText="No techniques match those filters."
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
