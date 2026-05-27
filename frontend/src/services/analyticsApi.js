import api from "./apiClient";

export const getDashboardAnalytics = () => api.get("/admin/analytics/dashboard").then(r => r.data);
