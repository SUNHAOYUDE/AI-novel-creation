import { apiClient } from "@/shared/api/client";
import type { ApiResponse, GenerateOutlinePayload, Outline, OutlinePayload } from "@/shared/types";

function ensureOutlinesArray(data: Outline[]) {
  if (!Array.isArray(data)) {
    throw new Error("大纲接口返回格式不正确");
  }

  return data;
}

export async function getOutlines(bookId?: number | null) {
  const response = await apiClient.get<ApiResponse<Outline[]>>("/outlines", {
    params: bookId !== null && bookId !== undefined ? { bookId } : undefined
  });

  return ensureOutlinesArray(response.data.data);
}

export async function generateOutlines(payload: GenerateOutlinePayload) {
  const response = await apiClient.post<ApiResponse<Outline[]>>("/outlines/generate", payload, {
    timeout: 30000
  });
  return ensureOutlinesArray(response.data.data);
}

export async function createOutline(payload: OutlinePayload) {
  const response = await apiClient.post<ApiResponse<Outline>>("/outlines", payload);
  return response.data.data;
}

export async function updateOutline(id: number, payload: OutlinePayload) {
  const response = await apiClient.patch<ApiResponse<Outline>>(`/outlines/${id}`, payload);
  return response.data.data;
}

export async function deleteOutline(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/outlines/${id}`);
  return response.data.data;
}
