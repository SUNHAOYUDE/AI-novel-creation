import { apiClient } from "@/shared/api/client";
import type { ApiResponse, GenerateOutlinePayload, Outline } from "@/shared/types";

function ensureOutlinesArray(data: Outline[]) {
  if (!Array.isArray(data)) {
    throw new Error("大纲接口返回格式不正确");
  }

  return data;
}

export async function getOutlines(bookId?: number) {
  const response = await apiClient.get<ApiResponse<Outline[]>>("/outlines", {
    params: bookId ? { bookId } : undefined
  });

  return ensureOutlinesArray(response.data.data);
}

export async function generateOutlines(payload: GenerateOutlinePayload) {
  const response = await apiClient.post<ApiResponse<Outline[]>>("/outlines/generate", payload, {
    timeout: 30000
  });
  return ensureOutlinesArray(response.data.data);
}
