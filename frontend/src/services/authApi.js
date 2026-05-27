import api from "./apiClient";
import { toLoginPayload, toRegisterPayload } from "../utils/validation";

export const adminRegister = form => api.post("/admin/auth/register", toRegisterPayload(form)).then(r => r.data);
export const adminLogin = form => api.post("/admin/auth/login", toLoginPayload(form)).then(r => r.data);
export const userRegister = form => api.post("/user/auth/register", toRegisterPayload(form)).then(r => r.data);
export const userLogin = form => api.post("/user/auth/login", toLoginPayload(form)).then(r => r.data);
