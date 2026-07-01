import { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { api } from "../api/client.js";
import { AuthContext } from "../App.jsx";

export default function Login() {
  const { login, user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(form);
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
        <span className="brand-kicker">MatLog</span>
        <h1>Back on the mat.</h1>
        <p>Log rounds, techniques, injuries, and belt progress from one focused training ledger.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        {error && <p className="error-message">{error}</p>}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p className="switch-link">
          New to MatLog? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
}
