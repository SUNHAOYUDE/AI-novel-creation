import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiClient = axios.create({
  baseURL: baseURL && baseURL.length > 0 ? baseURL : (import.meta.env.DEV ? "http://localhost:3000/api" : "/api"),
  timeout: 10000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof error !== "object" || !error) {
      return Promise.reject(error);
    }

    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data as { message?: unknown } | undefined;
    const message = data?.message;

    if (typeof message === "string" && message.trim().length > 0) {
      return Promise.reject(new Error(message));
    }

    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return Promise.reject(new Error(message.join("；")));
    }

    return Promise.reject(error);
  }
);
