import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import UserLoginPage from "./pages/UserLoginPage";
import UserRegisterPage from "./pages/UserRegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";

function AuthRedirect({ role, children }) {
  const { role: currentRole, token } = useSelector(state => state.auth);
  if (token && currentRole === role) {
    return <Navigate to={role === "admin" ? "/admin/dashboard" : "/user/dashboard"} replace />;
  }
  return children;
}

export default function App() {
  const { role, token } = useSelector(state => state.auth);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/admin/login" element={<AuthRedirect role="admin"><AdminLoginPage /></AuthRedirect>} />
          <Route path="/admin/register" element={<AuthRedirect role="admin"><AdminRegisterPage /></AuthRedirect>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/user/login" element={<AuthRedirect role="user"><UserLoginPage /></AuthRedirect>} />
          <Route path="/user/register" element={<AuthRedirect role="user"><UserRegisterPage /></AuthRedirect>} />
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={<Navigate to={role === "admin" ? "/admin/dashboard" : role === "user" ? "/user/dashboard" : "/user/login"} replace />}
          />
          <Route path="*" element={<Navigate to={token ? (role === "admin" ? "/admin/dashboard" : "/user/dashboard") : "/"} replace />} />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
}
