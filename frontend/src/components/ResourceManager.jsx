import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client.js";

function emptyFromFields(fields, initialValues = {}) {
  return fields.reduce((acc, field) => {
    acc[field.name] =
      initialValues[field.name] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
    return acc;
  }, {});
}

function normalizeValue(field, value) {
  if (field.type === "number") {
    return value === "" ? null : Number(value);
  }
  if (field.type === "checkbox") {
    return Boolean(value);
  }
  return value === "" ? null : value;
}

function formToPayload(fields, form) {
  return fields.reduce((payload, field) => {
    payload[field.name] = normalizeValue(field, form[field.name]);
    return payload;
  }, {});
}

function itemToForm(fields, item) {
  return fields.reduce((form, field) => {
    const value = item[field.name];
    form[field.name] = value ?? (field.type === "checkbox" ? false : "");
    return form;
  }, {});
}

function Field({ field, value, onChange }) {
  if (field.type === "select") {
    return (
      <label>
        {field.label}
        <select value={value} onChange={(event) => onChange(field.name, event.target.value)} required={field.required}>
          <option value="">Choose one</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="wide-field">
        {field.label}
        <textarea
          value={value || ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label>
      {field.label}
      <input
        type={field.type || "text"}
        value={value || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
        required={field.required}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
      />
    </label>
  );
}

export default function ResourceManager({
  title,
  eyebrow,
  description,
  resource,
  fields,
  formNote,
  initialValues,
  renderItem,
  emptyText,
}) {
  const emptyForm = useMemo(() => emptyFromFields(fields, initialValues), [fields, initialValues]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      setItems(await api.list(resource));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [resource]);

  useEffect(() => {
    if (!editingId) {
      setForm(emptyForm);
    }
  }, [editingId, emptyForm]);

  function changeField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = formToPayload(fields, form);
      if (editingId) {
        await api.update(resource, editingId, payload);
      } else {
        await api.create(resource, payload);
      }
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.remove(resource, id);
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>{editingId ? "Edit entry" : "Add entry"}</h2>
          {editingId && (
            <button className="ghost-button compact" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {formNote && !editingId && <p className="success-message">{formNote}</p>}
        {error && <p className="error-message">{error}</p>}
        <form className="form-grid" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <Field key={field.name} field={field} value={form[field.name]} onChange={changeField} />
          ))}
          <button className="primary-button" type="submit">
            {editingId ? "Save changes" : "Add entry"}
          </button>
        </form>
      </section>

      <section className="item-list">
        {loading && <div className="loading-panel">Loading entries...</div>}
        {!loading && items.length === 0 && <div className="empty-state">{emptyText}</div>}
        {items.map((item) => (
          <article className="log-card" key={item.id}>
            {renderItem(item)}
            <div className="card-actions">
              <button
                className="ghost-button compact"
                onClick={() => {
                  setEditingId(item.id);
                  setForm(itemToForm(fields, item));
                }}
              >
                Edit
              </button>
              <button className="danger-button compact" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
