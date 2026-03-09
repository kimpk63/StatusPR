const BASE_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';
const BASE = `${BASE_URL}/api`;

export async function getStatus() {
  const r = await fetch(`${BASE}/status`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getActivities(limit = 100) {
  const r = await fetch(`${BASE}/activities?limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getNotifications(unreadOnly = false) {
  const r = await fetch(`${BASE}/notifications?unread=${unreadOnly}&limit=50`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function markNotificationRead(id) {
  const r = await fetch(`${BASE}/notifications/${id}/read`, { method: 'PATCH' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getStatsToday() {
  const r = await fetch(`${BASE}/stats/today`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getDraftSummary() {
  const r = await fetch(`${BASE}/stats/draft-summary`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getLogs(limit = 50) {
  const r = await fetch(`${BASE}/logs?limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}