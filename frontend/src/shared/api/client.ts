import axios from "axios";

const baseURL = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: typeof baseURL === "string" && baseURL.trim().length > 0
    ? baseURL
    : (import.meta.env.DEV ? "http://localhost:3000/api" : "/api"),
  timeout: 5000
});
