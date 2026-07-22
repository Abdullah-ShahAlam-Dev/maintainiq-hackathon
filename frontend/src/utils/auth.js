import api from '../api/axios';

// The real session lives in an httpOnly cookie the browser manages for us —
// JS can't read it and doesn't need to. We keep a copy of the (non-sensitive)
// user object in localStorage purely so the UI can render instantly without
// waiting on a network round trip, and so isLoggedIn() has something to check.
export const saveAuth = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore — clearing local state below is what matters for the UI
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token'); // legacy cleanup — no longer used, but old browsers may still have it
};

// Heuristic only — the actual gate is the server checking the cookie on
// every protected request. If the cookie expires, the next API call 401s
// and callers should redirect to /login.
export const isLoggedIn = () => !!localStorage.getItem('user');
