import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("hbs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface backend error messages for auth and other API calls
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      error.message = "Cannot reach server. Is the backend running on port 5000?";
    } else if (error.response.data?.error) {
      error.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);

export default api;
