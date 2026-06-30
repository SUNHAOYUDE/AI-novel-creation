import { apiClient } from "@/shared/api/client";
import type { ApiResponse, Chapter, ChapterPayload } from "@/shared/types";

function ensureChaptersArray(data: Chapter[]) {
  if (!Array.isArray(data)) {
    throw new Error("章节列表接口返回格式不正确");
  }

  return data;
}

export async function getChapters(bookId?: number) {
  const response = await apiClient.get<ApiResponse<Chapter[]>>("/chapters", {
    params: bookId ? { bookId } : undefined
  });

  return ensureChaptersArray(response.data.data);
}

export async function createChapter(payload: ChapterPayload) {
  const response = await apiClient.post<ApiResponse<Chapter>>("/chapters", payload);
  return response.data.data;
}

export async function updateChapter(id: number, payload: ChapterPayload) {
  const response = await apiClient.patch<ApiResponse<Chapter>>(`/chapters/${id}`, payload);
  return response.data.data;
}

export async function deleteChapter(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/chapters/${id}`);
  return response.data.data;
}
