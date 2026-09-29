import apiClient from "./client";

export const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  profile: () => apiClient.get("/auth/profile"),
};

export const workoutApi = {
  create: (payload) => apiClient.post("/workouts", payload),
  list: (params = {}) => apiClient.get("/workouts", { params }),
  getById: (id) => apiClient.get(`/workouts/${id}`),
  update: (id, payload) => apiClient.put(`/workouts/${id}`, payload),
  remove: (id) => apiClient.delete(`/workouts/${id}`),
  search: (params = {}) => apiClient.get("/workouts/search", { params }),
  statistics: () => apiClient.get("/workouts/statistics"),
};

export const aiApi = {
  recommendation: (payload) => apiClient.post("/ai/recommendation", payload),
  insights: (payload = {}) => apiClient.post("/ai/insights", payload),
};
