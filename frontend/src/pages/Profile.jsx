import { useContext, useEffect, useState } from "react";

import { api } from "../api/client.js";
import { AuthContext } from "../App.jsx";

const belts = ["white", "blue", "purple", "brown", "black"];

export default function Profile() {
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.me().then(setForm).catch((err) => setError(err.message));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setSaved(false);
    setForm({ ...form, [name]: name === "stripe_count" ? Number(value) : value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const updated = await api.updateMe(form);
      localStorage.setItem("matlog_user", JSON.stringify(updated));
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) {
    return <div className="loading-panel">Loading profile...</div>;
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Athlete profile</span>
        <h1>Profile</h1>
        <p>Keep your rank and academy details current.</p>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error && <p className="error-message wide-field">{error}</p>}
        {saved && <p className="success-message wide-field">Profile updated.</p>}
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
          <input name="academy_name" value={form.academy_name || ""} onChange={updateField} />
        </label>
        <button className="primary-button wide-field" type="submit">Save profile</button>
      </form>
    </section>
  );
}
