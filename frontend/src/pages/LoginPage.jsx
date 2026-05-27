import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authApi";
import { setSession } from "../features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: data => {
      dispatch(setSession(data));
      if (data.user.role === "ADMIN") navigate("/admin");
      else navigate("/customer");
    },
    onError: err => setError(err.response?.data?.error || "Login failed")
  });

  return (
    <div className="container">
      <h1>Hotel Management Login</h1>
      <div className="card">
        <input placeholder="Email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
        />
        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in..." : "Login"}
        </button>
        {error ? <p className="error">{error}</p> : null}
        <p className="tip">Use /api/auth/register first to create ADMIN and CUSTOMER users.</p>
      </div>
    </div>
  );
}
