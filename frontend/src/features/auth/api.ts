import { apiClient } from "@/shared/api/client";
import type { ApiResponse, AuthResult, AuthUser } from "@/shared/types";

export async function register(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiResponse<AuthResult>>("/auth/register", payload);
  return response.data.data;
}

export async function login(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiResponse<AuthResult>>("/auth/login", payload);
  return response.data.data;
}

export async function getMe() {
  const response = await apiClient.get<ApiResponse<AuthUser | null>>("/auth/me");
  return response.data.data;
}

