import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Base URL for the API.
 *
 * A physical device cannot reach "localhost" - that resolves to the phone
 * itself - so set `expo.extra.apiBaseUrl` in app.json to your machine's LAN
 * address when running on hardware. The defaults below cover the simulators:
 * the Android emulator reaches the host through 10.0.2.2, while the iOS
 * simulator and the web build share the host's own localhost.
 */
const DEFAULT_BASE = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api'
});

export const API_BASE =
  (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.apiBaseUrl) ||
  DEFAULT_BASE;

const TOKEN_KEY = 'ce_token';
const USER_KEY = 'ce_user';

export const storage = {
  async save(token, user) {
    await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(user)]]);
  },
  async load() {
    const entries = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    const map = Object.fromEntries(entries);
    if (!map[TOKEN_KEY]) return null;
    try {
      return { token: map[TOKEN_KEY], user: JSON.parse(map[USER_KEY]) };
    } catch {
      return null;
    }
  },
  async clear() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body, auth = true, multipart = false } = {}) {
  const headers = {};

  if (auth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (body && !multipart) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: multipart ? body : body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error(`Cannot reach the server at ${API_BASE}. Check that the backend is running and the address is correct.`);
  }

  if (res.status === 401 && auth) {
    await storage.clear();
    onUnauthorized();
    throw new Error('Your session expired. Please sign in again.');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),

  institutions: () => request('/institutions', { auth: false }),
  createInstitution: (payload) => request('/institutions', { method: 'POST', body: payload }),

  categories: () => request('/events/meta/categories', { auth: false }),
  listEvents: (filters = {}) => {
    const pairs = Object.entries(filters).filter(([, v]) => v);
    const qs = pairs.length
      ? `?${pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`
      : '';
    return request(`/events${qs}`);
  },
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (formData) => request('/events/create', { method: 'POST', body: formData, multipart: true }),
  updateEvent: (id, formData) => request(`/events/${id}`, { method: 'PUT', body: formData, multipart: true }),
  deleteEvent: (id) => request(`/events/${id}/delete`, { method: 'DELETE' }),
  registerForEvent: (id) => request(`/events/${id}/register`, { method: 'POST' }),
  participants: (id) => request(`/events/${id}/participants`),

  profile: () => request('/users/profile'),
  updateProfile: (payload) => request('/users/profile/update', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/users/change-password', { method: 'PUT', body: payload })
};

export function imageUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : API_BASE.replace(/\/api$/, '') + path;
}
