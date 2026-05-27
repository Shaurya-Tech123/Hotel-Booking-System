import { useState } from "react";
import { COUNTRY_CODES } from "../constants";
import { validateRegistration } from "../utils/validation";

const emptyForm = {
  username: "",
  email: "",
  countryCode: "+91",
  phone: "",
  password: "",
  confirmPassword: ""
};

export default function RegisterForm({ onSubmit, loading, title }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const update = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = e => {
    e.preventDefault();
    const validationErrors = validateRegistration(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    onSubmit(form);
  };

  const field = (name, label, type = "text") => (
    <div className="form-group" key={name}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={e => update(name, e.target.value)}
        className={errors[name] ? "input-error" : ""}
        autoComplete={name === "password" || name === "confirmPassword" ? "new-password" : name}
        disabled={loading}
      />
      {errors[name] ? <span className="field-error">{errors[name]}</span> : null}
    </div>
  );

  return (
    <form className="auth-form card" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      {field("username", "Username")}
      {field("email", "Email", "email")}
      <div className="form-group">
        <label htmlFor="countryCode">Country Code</label>
        <select
          id="countryCode"
          name="countryCode"
          value={form.countryCode}
          onChange={e => update("countryCode", e.target.value)}
          className={errors.countryCode ? "input-error" : ""}
          disabled={loading}
        >
          {COUNTRY_CODES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.countryCode ? <span className="field-error">{errors.countryCode}</span> : null}
      </div>
      {field("phone", "Phone (10 digits)", "tel")}
      {field("password", "Password", "password")}
      {field("confirmPassword", "Confirm Password", "password")}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
