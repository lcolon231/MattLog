import { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { api } from "../api/client.js";
import { AuthContext } from "../App.jsx";

const belts = ["white", "blue", "purple", "brown", "black"];

export default function Register() {
  const { login, user } = useContext(AuthContext);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    belt_rank: "white",
    stripe_count: 0,
    academy_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: name === "stripe_count" ? Number(value) : value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.register(form);
      login(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <span className="brand-kicker">Start the ledger</span>
        <h1>Track the quiet work.</h1>
        <p>MatLog is built for students who want their training history to be readable, useful, and honest.</p>
      </div>

      <form className="auth-card form-grid" onSubmit={handleSubmit}>
        <h2 className="wide-field">Create account</h2>
        {error && <p className="error-message wide-field">{error}</p>}
        <label>
          First name
          <input name="first_name" value={form.first_name} onChange={updateField} required />
        </label>
        <label>
          Last name
          <input name="last_name" value={form.last_name} onChange={updateField} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="8" value={form.password} onChange={updateField} required />
        </label>
        <label>
          Belt rank
          <select name="belt_rank" value={form.belt_rank} onChange={updateField}>
            {belts.map((belt) => (
              <option key={belt} value={belt}>
                {belt}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stripes
          <input name="stripe_count" type="number" min="0" max="4" value={form.stripe_count} onChange={updateField} />
        </label>
        <label className="wide-field">
          Academy name
          <input name="academy_name" value={form.academy_name} onChange={updateField} />
        </label>
        <button className="primary-button wide-field" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
        <p className="switch-link wide-field">
          Already logging? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
