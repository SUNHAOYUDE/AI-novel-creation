import { apiClient } from "@/shared/api/client";
import type { ApiResponse, WorldMap, WorldMapPayload } from "@/shared/types";

function ensureWorldMapsArray(data: WorldMap[]) {
  if (!Array.isArray(data)) {
    throw new Error("地图接口返回格式不正确");
  }

  return data;
}

export async function getWorldMaps(bookId?: number) {
  const response = await apiClient.get<ApiResponse<WorldMap[]>>("/world-maps", {
    params: bookId ? { bookId } : undefined
  });

  return ensureWorldMapsArray(response.data.data);
}

export async function createWorldMap(payload: WorldMapPayload) {
  const response = await apiClient.post<ApiResponse<WorldMap>>("/world-maps", payload);
  return response.data.data;
}

export async function updateWorldMap(id: number, payload: WorldMapPayload) {
  const response = await apiClient.patch<ApiResponse<WorldMap>>(`/world-maps/${id}`, payload);
  return response.data.data;
}

export async function deleteWorldMap(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/world-maps/${id}`);
  return response.data.data;
}
