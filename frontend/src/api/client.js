const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("matlog_token");
}

export function saveAuth(accessToken, user) {
  localStorage.setItem("matlog_token", accessToken);
  localStorage.setItem("matlog_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("matlog_token");
  localStorage.removeItem("matlog_user");
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("matlog_user");
  return rawUser ? JSON.parse(rawUser) : null;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

async function download(path, filename) {
  const token = getToken();
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/users/me"),
  updateMe: (payload) => request("/users/me", { method: "PUT", body: JSON.stringify(payload) }),
  dashboard: () => request("/dashboard/stats"),
  injuryAlerts: () => request("/dashboard/injury-alerts"),
  trainingLoad: () => request("/dashboard/training-load"),
  coachSummary: (days = 30) => request(`/reports/coach-summary?days=${days}`),
  timeline: (days = 365) => request(`/reports/timeline?days=${days}`),
  rollingWeeklyStats: (weeks = 8) => request(`/rolling/stats/weekly?weeks=${weeks}`),
  downloadCoachCsv: (days = 30) => download(`/reports/coach-summary.csv?days=${days}`, "matlog-coach-summary.csv"),
  downloadCoachPdf: (days = 30) => download(`/reports/coach-summary.pdf?days=${days}`, "matlog-coach-summary.pdf"),
  list: (resource) => request(`/${resource}`),
  create: (resource, payload) => request(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (resource, id, payload) => request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE" }),
};
