import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";

function toForm(session) {
  return {
    date: session.date,
    class_type: session.class_type,
    duration_minutes: session.duration_minutes,
    intensity: session.intensity,
    techniques_learned: session.techniques_learned || "",
    notes: session.notes || "",
    felt_dizzy: session.felt_dizzy,
    fasted_before_training: session.fasted_before_training,
  };
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    intensity: "",
    startDate: "",
    endDate: "",
    injuryOnly: false,
  });

  async function loadSessions() {
    setLoading(true);
    setError("");
    try {
      const [nextSessions, nextInjuries] = await Promise.all([
        api.list("sessions"),
        api.list("injuries"),
      ]);
      setSessions(nextSessions);
      setInjuries(nextInjuries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  function updateField(event) {
    const { name, type, value, checked } = event.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    });
  }

  function updateFilter(event) {
    const { name, type, value, checked } = event.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  const injurySessionIds = useMemo(
    () => new Set(injuries.filter((injury) => injury.session_id).map((injury) => injury.session_id)),
    [injuries]
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const search = filters.search.trim().toLowerCase();
        const searchable = `${session.techniques_learned || ""} ${session.notes || ""}`.toLowerCase();
        const matchesSearch = !search || searchable.includes(search);
        const matchesIntensity = !filters.intensity || session.intensity === filters.intensity;
        const matchesStart = !filters.startDate || session.date >= filters.startDate;
        const matchesEnd = !filters.endDate || session.date <= filters.endDate;
        const matchesInjury = !filters.injuryOnly || injurySessionIds.has(session.id);

        return matchesSearch && matchesIntensity && matchesStart && matchesEnd && matchesInjury;
      }),
    [filters, injurySessionIds, sessions]
  );

  async function saveEdit(event) {
    event.preventDefault();
    setError("");
    try {
      await api.update("sessions", editingId, form);
      setEditingId(null);
      setForm(null);
      await loadSessions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSession(id) {
    setError("");
    try {
      await api.remove("sessions", id);
      await loadSessions();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading with-action">
        <div>
          <span>Training history</span>
          <h1>Sessions</h1>
          <p>Review classes, intensity, mat notes, and recovery flags.</p>
        </div>
        <Link className="primary-button" to="/sessions/new">Add session</Link>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <div className="loading-panel">Loading sessions...</div>}
      {!loading && sessions.length === 0 && (
        <div className="empty-state">No sessions yet. Add your first class to start the log.</div>
      )}
      {!loading && sessions.length > 0 && (
        <section className="panel filter-panel">
          <label className="wide-field">
            Search notes or techniques
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Armbar, passing, tired..."
            />
          </label>
          <label>
            Intensity
            <select name="intensity" value={filters.intensity} onChange={updateFilter}>
              <option value="">All</option>
              <option value="light">light</option>
              <option value="moderate">moderate</option>
              <option value="hard">hard</option>
              <option value="competition pace">competition pace</option>
            </select>
          </label>
          <label>
            From
            <input name="startDate" type="date" value={filters.startDate} onChange={updateFilter} />
          </label>
          <label>
            To
            <input name="endDate" type="date" value={filters.endDate} onChange={updateFilter} />
          </label>
          <label className="checkbox-row">
            <input
              name="injuryOnly"
              type="checkbox"
              checked={filters.injuryOnly}
              onChange={updateFilter}
            />
            <span>Injury-related only</span>
          </label>
        </section>
      )}

      <section className="item-list">
        {!loading && sessions.length > 0 && filteredSessions.length === 0 && (
          <div className="empty-state">No sessions match those filters.</div>
        )}
        {filteredSessions.map((session) => (
          <article className="log-card" key={session.id}>
            {editingId === session.id ? (
              <form className="form-grid" onSubmit={saveEdit}>
                <label>
                  Date
                  <input name="date" type="date" value={form.date} onChange={updateField} required />
                </label>
                <label>
                  Class type
                  <input name="class_type" value={form.class_type} onChange={updateField} required />
                </label>
                <label>
                  Duration
                  <input name="duration_minutes" type="number" min="1" value={form.duration_minutes} onChange={updateField} required />
                </label>
                <label>
                  Intensity
                  <input name="intensity" value={form.intensity} onChange={updateField} required />
                </label>
                <label className="wide-field">
                  Techniques learned
                  <textarea name="techniques_learned" value={form.techniques_learned} onChange={updateField} />
                </label>
                <label className="wide-field">
                  Notes
                  <textarea name="notes" value={form.notes} onChange={updateField} />
                </label>
                <label className="checkbox-row">
                  <input name="felt_dizzy" type="checkbox" checked={form.felt_dizzy} onChange={updateField} />
                  <span>Felt dizzy</span>
                </label>
                <label className="checkbox-row">
                  <input
                    name="fasted_before_training"
                    type="checkbox"
                    checked={form.fasted_before_training}
                    onChange={updateField}
                  />
                  <span>Fasted before training</span>
                </label>
                <div className="form-actions wide-field">
                  <button className="ghost-button" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="primary-button" type="submit">Save changes</button>
                </div>
              </form>
            ) : (
              <>
                <div className="card-main">
                  <div>
                    <span className="card-date">Session #{session.id} / {session.date}</span>
                    <h2>{session.class_type}</h2>
                    <p>{session.techniques_learned || session.notes || "No notes added."}</p>
                  </div>
                  <div className="metric-pill">{session.duration_minutes} min</div>
                </div>
                <div className="tag-row">
                  <span>{session.intensity}</span>
                  {injurySessionIds.has(session.id) && <span>injury linked</span>}
                  {session.felt_dizzy && <span>dizzy</span>}
                  {session.fasted_before_training && <span>fasted</span>}
                </div>
                <div className="card-actions">
                  <button
                    className="ghost-button compact"
                    onClick={() => {
                      setEditingId(session.id);
                      setForm(toForm(session));
                    }}
                  >
                    Edit
                  </button>
                  <button className="danger-button compact" onClick={() => deleteSession(session.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
