import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe, logout as apiLogout, setUnauthorizedHandler } from "../api/blogApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Cookie may already be cleared/expired — still drop local session.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback((newUser) => {
    setUser(newUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        // Clear any legacy JWT left in localStorage from older builds.
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const data = await getMe(controller.signal);
        if (data?.user) {
          setUser({
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setBootstrapping(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      bootstrapping,
      login,
      logout,
      updateUser,
    }),
    [user, bootstrapping, login, logout, updateUser],
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
