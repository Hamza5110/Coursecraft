import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
