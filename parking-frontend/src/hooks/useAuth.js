/**
 * useAuth - Custom hook to access authentication state from localStorage.
 * Returns a `user` object with fields derived from stored login data.
 *
 * Fields stored at login (Login.jsx):
 *   - token    -> localStorage 'token'
 *   - role     -> localStorage 'role'   (e.g. "ROLE_MANAGER")
 *   - username -> localStorage 'username'
 *
 * Additional fields like `buildingId` are not stored at login;
 * consumers should fallback gracefully (e.g. user?.buildingId || 1).
 */
import { useMemo } from 'react';

export const useAuth = () => {
  const user = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const rawRole = localStorage.getItem('role') || '';
    const normalizedRole = rawRole.replace('ROLE_', '');

    return {
      token,
      role: normalizedRole,
      rawRole,
      username: localStorage.getItem('username') || '',
      accountId: localStorage.getItem('accountId') ? parseInt(localStorage.getItem('accountId'), 10) : null,
      // buildingId is not stored at login; falls back to null (callers use || 1)
      buildingId: null,
    };
  }, []);

  const isAuthenticated = !!user;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('accountId');
    window.location.href = '/login';
  };

  return { user, isAuthenticated, logout };
};
