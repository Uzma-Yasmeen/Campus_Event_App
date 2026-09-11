/* Thin wrapper around the Campus Events REST API. */

const API_BASE = window.CAMPUS_API_BASE || 'http://localhost:5000/api';

const Auth = {
  get token() { return localStorage.getItem('ce_token'); },
  get user() {
    try { return JSON.parse(localStorage.getItem('ce_user') || 'null'); }
    catch { return null; }
  },
  save(token, user) {
    localStorage.setItem('ce_token', token);
    localStorage.setItem('ce_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('ce_token');
    localStorage.removeItem('ce_user');
  },
  isOrganizer() { return Auth.user && Auth.user.role === 'organizer'; }
};

async function request(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = {};
  if (auth && Auth.token) headers['Authorization'] = `Bearer ${Auth.token}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: raw ? body : (body ? JSON.stringify(body) : undefined)
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  // An expired or invalid token should send the user back to sign-in.
  if (res.status === 401 && auth && Auth.token) {
    Auth.clear();
    window.location.href = 'signin.html';
    throw new Error('Session expired');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

function query(params) {
  const pairs = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '');
  return pairs.length ? `?${new URLSearchParams(pairs)}` : '';
}

const api = {
  base: API_BASE,

  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  institutions: () => request('/institutions', { auth: false }),
  createInstitution: (payload) => request('/institutions', { method: 'POST', body: payload }),

  categories: () => request('/events/meta/categories', { auth: false }),
  listEvents: (filters = {}) => request(`/events${query(filters)}`),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (formData) => request('/events/create', { method: 'POST', body: formData, raw: true }),
  updateEvent: (id, formData) => request(`/events/${id}`, { method: 'PUT', body: formData, raw: true }),
  deleteEvent: (id) => request(`/events/${id}/delete`, { method: 'DELETE' }),
  registerForEvent: (id) => request(`/events/${id}/register`, { method: 'POST' }),
  participants: (id) => request(`/events/${id}/participants`),

  profile: () => request('/users/profile'),
  updateProfile: (payload) => request('/users/profile/update', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/users/change-password', { method: 'PUT', body: payload }),
  updateSettings: (payload) => request('/users/settings', { method: 'PUT', body: payload }),
  uploadAvatar: (formData) => request('/users/avatar', { method: 'POST', body: formData, raw: true })
};
