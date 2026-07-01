import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    setLoading(true);
    setError("");
    try {
      setSessions(await api.list("sessions"));
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

      <section className="item-list">
        {sessions.map((session) => (
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
