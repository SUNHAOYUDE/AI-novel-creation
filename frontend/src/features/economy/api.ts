import { apiClient } from "@/shared/api/client";
import type { ApiResponse, EconomyEntry, EconomyEntryPayload } from "@/shared/types";

function ensureEconomyEntriesArray(data: EconomyEntry[]) {
  if (!Array.isArray(data)) {
    throw new Error("经济系统接口返回格式不正确");
  }

  return data;
}

export async function getEconomyEntries(bookId?: number) {
  const response = await apiClient.get<ApiResponse<EconomyEntry[]>>("/economy-entries", {
    params: bookId ? { bookId } : undefined
  });

  return ensureEconomyEntriesArray(response.data.data);
}

export async function createEconomyEntry(payload: EconomyEntryPayload) {
  const response = await apiClient.post<ApiResponse<EconomyEntry>>("/economy-entries", payload);
  return response.data.data;
}

export async function updateEconomyEntry(id: number, payload: EconomyEntryPayload) {
  const response = await apiClient.patch<ApiResponse<EconomyEntry>>(`/economy-entries/${id}`, payload);
  return response.data.data;
}

export async function deleteEconomyEntry(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/economy-entries/${id}`);
  return response.data.data;
}
