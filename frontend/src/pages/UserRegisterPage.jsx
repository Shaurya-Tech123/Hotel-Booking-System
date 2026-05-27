import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import RegisterForm from "../components/RegisterForm";
import { userRegister } from "../services/authApi";
import { setAuth } from "../features/auth/authSlice";

export default function UserRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async form => {
    setLoading(true);
    try {
      const data = await userRegister(form);
      if (!data?.token || !data?.user) {
        throw new Error("Invalid server response");
      }
      dispatch(setAuth({ role: "user", token: data.token, profile: data.user }));
      toast.success(data.message || "Account created successfully");
      navigate("/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <RegisterForm title="User Registration" onSubmit={handleRegister} loading={loading} />
      <p className="auth-link center">
        Already registered? <Link to="/user/login">Login</Link>
      </p>
    </div>
  );
}
