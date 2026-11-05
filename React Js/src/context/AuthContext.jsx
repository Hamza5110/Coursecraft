import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setUnauthorizedHandler } from "../api/blogApi";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => readStoredUser());

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") {
        setToken(localStorage.getItem("token"));
        setUser(readStoredUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoggedIn: !!token,
      login,
      logout,
      updateUser,
    }),
    [token, user, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
