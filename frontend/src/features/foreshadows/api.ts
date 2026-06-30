import { apiClient } from "@/shared/api/client";
import type { ApiResponse, Foreshadow, ForeshadowPayload } from "@/shared/types";

function ensureForeshadowsArray(data: Foreshadow[]) {
  if (!Array.isArray(data)) {
    throw new Error("伏笔列表接口返回格式不正确");
  }

  return data;
}

export async function getForeshadows(bookId?: number | null) {
  const response = await apiClient.get<ApiResponse<Foreshadow[]>>("/foreshadows", {
    params: bookId !== null && bookId !== undefined ? { bookId } : undefined
  });

  return ensureForeshadowsArray(response.data.data);
}

export async function createForeshadow(payload: ForeshadowPayload) {
  const response = await apiClient.post<ApiResponse<Foreshadow>>("/foreshadows", payload);
  return response.data.data;
}

export async function updateForeshadow(id: number, payload: ForeshadowPayload) {
  const response = await apiClient.patch<ApiResponse<Foreshadow>>(`/foreshadows/${id}`, payload);
  return response.data.data;
}

export async function deleteForeshadow(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/foreshadows/${id}`);
  return response.data.data;
}
