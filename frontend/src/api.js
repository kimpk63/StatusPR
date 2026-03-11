const BASE_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';
const BASE = `${BASE_URL}/api`;

function authHeaders() {
  const tokens = localStorage.getItem('tokens');
  if (tokens) {
    try {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) return { Authorization: `Bearer ${accessToken}` };
    } catch {}
  }
  return {};
}

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
// ---------- video review APIs ----------

export async function getVideoWithComments(videoId) {
  const r = await fetch(`${BASE}/videos/${videoId}`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postVideoComment(videoId, comment) {
  const r = await fetch(`${BASE}/videos/${videoId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(comment),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function patchCommentCheck(commentId) {
  const r = await fetch(`${BASE}/comments/${commentId}/check`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteComment(commentId) {
  const r = await fetch(`${BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function patchVideoStatus(videoId, status) {
  const r = await fetch(`${BASE}/videos/${videoId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// uploads & dashboard
export async function uploadVideo(formData, options = {}) {
  const r = await fetch(`${BASE}/uploads/video`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
    ...options,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getUploadedVideos(params = {}) {
  const qp = new URLSearchParams(params).toString();
  const r = await fetch(`${BASE}/uploads/videos?${qp}`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteUploadedVideo(videoId) {
  const r = await fetch(`${BASE}/uploads/videos/${videoId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getDashboardStats() {
  const r = await fetch(`${BASE}/dashboard/stats`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listVideos(filters = {}) {
  const qp = new URLSearchParams(filters).toString();
  const r = await fetch(`${BASE}/videos?${qp}`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// exports
export function downloadCommentsPDF(videoId) {
  // return URL to be used directly as href in <a>
  return `${BASE}/exports/video/${videoId}/comments`;
}

export async function getExportProgress(videoId) {
  const r = await fetch(`${BASE}/exports/video/${videoId}/progress`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// review queue
export async function getReviewQueue() {
  const r = await fetch(`${BASE}/review/queue`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getReviewStats() {
  const r = await fetch(`${BASE}/review/stats`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
