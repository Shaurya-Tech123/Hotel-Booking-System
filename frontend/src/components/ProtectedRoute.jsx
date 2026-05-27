import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children, role }) {
  const { token, role: userRole } = useSelector(state => state.auth);
  if (!token) return <Navigate to={role === "admin" ? "/admin/login" : "/user/login"} replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return children;
}
