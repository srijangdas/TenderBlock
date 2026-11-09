import { createContext, useContext, useEffect, useState } from "react";
import { authApi, staffAuthApi } from "../api/services";
import { sessionFromRegistration } from "../api/authSession";
import { http } from "../api/http";
import { BACKEND_CONTRACT, DEMO_MODE } from "../data/constants";

const AuthContext = createContext(null);
const STORAGE_KEY = "tenderblock_session_v3";
function loadSession() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    const saved = data ? JSON.parse(data) : null;
    if (!DEMO_MODE && saved?.token === "DEMO_TOKEN_NOT_FOR_PRODUCTION") {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Older browser-preview sessions had only a verified flag. This migration
    // is restricted to demo mode; real API account status is never inferred.
    if (
      DEMO_MODE &&
      saved?.user &&
      !saved.user.accountStatus &&
      typeof saved.user.verified === "boolean"
    ) {
      saved.user.accountStatus = saved.user.verified ? "VERIFIED" : "PENDING";
    }
    return saved;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    function expire() {
      sessionStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setSessionExpired(true);
    }
    window.addEventListener("tenderblock:session-expired", expire);
    return () =>
      window.removeEventListener("tenderblock:session-expired", expire);
  }, []);
  const updateUser = (fields) => {
    setSession((old) => {
      if (!old) return old;
      const next = { ...old, user: { ...old.user, ...fields } };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };
  const refreshUserStatus = async () => {
    if (!session?.token || !session?.user?.id) return false;
    const storedUser = session.user;
    const unverified =
      storedUser.accountStatus !== "VERIFIED" && storedUser.verified !== true;
    if (!unverified) return true;

    try {
      const response = await http("/auth/me/status", { token: session.token });
      const accountStatus = response?.accountStatus ?? response?.status;
      if (!accountStatus) return false;
      const mergedUser = {
        ...storedUser,
        accountStatus,
        verified: accountStatus === "VERIFIED",
      };
      const nextSession = { ...session, user: mergedUser };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      return accountStatus === "VERIFIED";
    } catch {
      return false;
    }
  };
  useEffect(() => {
    if (!session?.token || !session?.user?.id) return;
    const shouldCheck =
      session.user.accountStatus !== "VERIFIED" &&
      session.user.verified !== true;
    if (!shouldCheck) return;

    const check = () => {
      void refreshUserStatus();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
    };
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) check();
    };

    check();
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [
    session?.token,
    session?.user?.id,
    session?.user?.accountStatus,
    session?.user?.verified,
  ]);
  const login = async (form) => {
    const result = await authApi.login(form);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setSession(result);
    setSessionExpired(false);
    return result.user;
  };
  const staffLogin = async (form) => {
    const result = await staffAuthApi.login(form);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setSession(result);
    setSessionExpired(false);
    return result.user;
  };
  const register = async (form) => {
    // A successful registration isn't the same as a successful HTTP connection.
    // Do not synthesize an account or save any session if Spring Boot returned 502.
    const created = await authApi.register(form);
    if (!DEMO_MODE && BACKEND_CONTRACT === "team") {
      const newSession = sessionFromRegistration(created);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setSessionExpired(false);
      return { ...created, signedIn: true };
    }
    if (DEMO_MODE) {
      // Browser-only registration has no JWT; sign in against the same demo store.
      const newSession = await authApi.login({
        email: form.email,
        password: form.password,
      });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setSessionExpired(false);
      return { ...created, signedIn: true };
    }
    // The legacy integration overlay has a different registration contract.
    return { ...created, signedIn: false };
  };
  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setSessionExpired(false);
  };
  const value = {
    session,
    user: session?.user || null,
    token: session?.token || null,
    login,
    staffLogin,
    register,
    logout,
    updateUser,
    refreshUserStatus,
    sessionExpired,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
