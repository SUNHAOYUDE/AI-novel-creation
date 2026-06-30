import { apiClient } from "@/shared/api/client";
import type { ApiResponse, SystemSettings, UpdateSystemSettingsPayload } from "@/shared/types";

export async function getSystemSettings() {
  const response = await apiClient.get<ApiResponse<SystemSettings>>("/system-settings");
  return response.data.data;
}

export async function updateSystemSettings(payload: UpdateSystemSettingsPayload) {
  const response = await apiClient.patch<ApiResponse<SystemSettings>>("/system-settings", payload);
  return response.data.data;
}
