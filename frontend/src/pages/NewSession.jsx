import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client.js";

const today = new Date().toISOString().slice(0, 10);

export default function NewSession() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: today,
    class_type: "Fundamentals",
    duration_minutes: 60,
    intensity: "moderate",
    techniques_learned: "",
    notes: "",
    felt_dizzy: false,
    fasted_before_training: false,
    got_injured: false,
  });
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, type, value, checked } = event.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const { got_injured, ...sessionPayload } = form;
      const session = await api.create("sessions", sessionPayload);
      if (got_injured) {
        navigate(`/injuries?fromSession=${session.id}`);
        return;
      }
      navigate("/sessions");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Class notes</span>
        <h1>Add training session</h1>
        <p>Capture what happened while the details are still fresh.</p>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error && <p className="error-message wide-field">{error}</p>}
        <label>
          Date
          <input name="date" type="date" value={form.date} onChange={updateField} required />
        </label>
        <label>
          Class type
          <input name="class_type" value={form.class_type} onChange={updateField} required />
        </label>
        <label>
          Duration minutes
          <input name="duration_minutes" type="number" min="1" value={form.duration_minutes} onChange={updateField} required />
        </label>
        <label>
          Intensity
          <select name="intensity" value={form.intensity} onChange={updateField}>
            <option value="light">light</option>
            <option value="moderate">moderate</option>
            <option value="hard">hard</option>
            <option value="competition pace">competition pace</option>
          </select>
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
        <label className="checkbox-row">
          <input name="got_injured" type="checkbox" checked={form.got_injured} onChange={updateField} />
          <span>I got injured during this session</span>
        </label>
        <div className="form-actions wide-field">
          <Link className="ghost-button" to="/sessions">Cancel</Link>
          <button className="primary-button" type="submit">
            {form.got_injured ? "Save session and log injury" : "Save session"}
          </button>
        </div>
      </form>
    </section>
  );
}
