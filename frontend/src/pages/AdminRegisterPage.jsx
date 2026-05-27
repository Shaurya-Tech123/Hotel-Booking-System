import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import RegisterForm from "../components/RegisterForm";
import { adminRegister } from "../services/authApi";
import { setAuth } from "../features/auth/authSlice";

export default function AdminRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async form => {
    setLoading(true);
    try {
      const data = await adminRegister(form);
      if (!data?.token || !data?.admin) {
        throw new Error("Invalid server response");
      }
      dispatch(setAuth({ role: "admin", token: data.token, profile: data.admin }));
      toast.success(data.message || "Admin account created");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <RegisterForm title="Admin Registration" onSubmit={handleRegister} loading={loading} />
      <p className="auth-link center">
        Already registered? <Link to="/admin/login">Login</Link>
      </p>
    </div>
  );
}
