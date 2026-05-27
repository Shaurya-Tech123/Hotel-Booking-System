import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { userLogin } from "../services/authApi";
import { setAuth } from "../features/auth/authSlice";
import { validateLogin } from "../utils/validation";

export default function UserLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    const validationErrors = validateLogin(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setLoading(true);
    try {
      const data = await userLogin(form);
      if (!data?.token || !data?.user) {
        throw new Error("Invalid server response");
      }
      dispatch(setAuth({ role: "user", token: data.token, profile: data.user }));
      toast.success(data.message || "Welcome back!");
      navigate("/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-form" onSubmit={submit} noValidate>
        <h2>User Login</h2>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            className={errors.username ? "input-error" : ""}
            autoComplete="username"
            disabled={loading}
          />
          {errors.username ? <span className="field-error">{errors.username}</span> : null}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className={errors.password ? "input-error" : ""}
            autoComplete="current-password"
            disabled={loading}
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="auth-link">
          New user? <Link to="/user/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
