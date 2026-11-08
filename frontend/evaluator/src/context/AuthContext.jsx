import { createContext, useContext, useState } from 'react';
import { login as loginRequest } from '../api/authApi';

const AuthContext = createContext(null);
const STORAGE_KEY = 'tb-evaluator-session';
function storedSession() { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(storedSession);
  async function login(email, password) {
    const next = await loginRequest(email, password);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next.user;
  }
  function logout() { sessionStorage.removeItem(STORAGE_KEY); setSession(null); }
  return <AuthContext.Provider value={{ session, user: session?.user || null, token: session?.token || null, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
