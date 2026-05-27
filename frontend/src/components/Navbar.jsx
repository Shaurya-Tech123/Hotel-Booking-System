import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../features/auth/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, profile } = useSelector(state => state.auth);

  const logout = () => {
    dispatch(clearAuth());
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        StayBook
      </Link>
      <nav>
        {!role && (
          <>
            <Link to="/admin/login">Admin Login</Link>
            <Link to="/user/login">User Login</Link>
          </>
        )}
        {role === "admin" && <Link to="/admin/dashboard">Dashboard</Link>}
        {role === "user" && <Link to="/user/dashboard">Dashboard</Link>}
        {role && (
          <button type="button" className="btn-ghost" onClick={logout}>
            Logout ({profile?.username})
          </button>
        )}
      </nav>
    </header>
  );
}
