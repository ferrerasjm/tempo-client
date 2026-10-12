import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 12000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("tempo-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
http.interceptors.response.use((response) => response, (error) => {
  const currentToken = localStorage.getItem("tempo-token");
  if (error.response?.status === 401 && !["/auth/login", "/auth/signup"].includes(error.config?.url) &&
      currentToken && error.config?.headers?.Authorization === `Bearer ${currentToken}`) {
    localStorage.removeItem("tempo-token");
    window.dispatchEvent(new Event("tempo-login-expired"));
  }
  return Promise.reject(error);
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Could not reach the cafe. Check the server and try again."
    );
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
