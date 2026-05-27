const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@&#_]+$/;

export function validateRegistration(form) {
  const errors = {};
  const username = (form.username || "").trim();
  const email = (form.email || "").trim();
  const phone = (form.phone || "").trim();
  const password = form.password || "";
  const confirmPassword = form.confirmPassword || "";

  if (!username) {
    errors.username = "Username is required";
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username = "Username must be alphanumeric only";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!form.countryCode) {
    errors.countryCode = "Select country code";
  }

  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Phone must be exactly 10 digits";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.password = "Password needs letters, numbers, and only @ & _ #";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function validateLogin(form) {
  const errors = {};
  if (!(form.username || "").trim()) errors.username = "Username is required";
  if (!form.password) errors.password = "Password is required";
  return errors;
}

// Payload sent to API (excludes confirmPassword)
export function toRegisterPayload(form) {
  return {
    username: form.username.trim(),
    email: form.email.trim().toLowerCase(),
    countryCode: form.countryCode,
    phone: form.phone.trim(),
    password: form.password
  };
}

export function toLoginPayload(form) {
  return {
    username: form.username.trim(),
    password: form.password
  };
}
