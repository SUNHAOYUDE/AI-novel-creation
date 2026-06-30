import { apiClient } from "@/shared/api/client";
import type { ApiResponse, Backstory, BackstoryPayload, GenerateBackstoryPayload } from "@/shared/types";

function ensureBackstoriesArray(data: Backstory[]) {
  if (!Array.isArray(data)) {
    throw new Error("背景故事列表接口返回格式不正确");
  }

  return data;
}

export async function getBackstories(bookId?: number | null) {
  const response = await apiClient.get<ApiResponse<Backstory[]>>("/backstories", {
    params: bookId !== null && bookId !== undefined ? { bookId } : undefined
  });

  return ensureBackstoriesArray(response.data.data);
}

export async function createBackstory(payload: BackstoryPayload) {
  const response = await apiClient.post<ApiResponse<Backstory>>("/backstories", payload);
  return response.data.data;
}

export async function updateBackstory(id: number, payload: BackstoryPayload) {
  const response = await apiClient.patch<ApiResponse<Backstory>>(`/backstories/${id}`, payload);
  return response.data.data;
}

export async function deleteBackstory(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/backstories/${id}`);
  return response.data.data;
}

export async function generateBackstories(payload: GenerateBackstoryPayload) {
  const response = await apiClient.post<ApiResponse<Backstory[]>>("/backstories/generate", payload, {
    timeout: 30000
  });

  return ensureBackstoriesArray(response.data.data);
}
