import { apiClient } from "@/shared/api/client";
import type { ApiResponse, Character, CharacterPayload } from "@/shared/types";

function ensureCharactersArray(data: Character[]) {
  if (!Array.isArray(data)) {
    throw new Error("角色列表接口返回格式不正确");
  }

  return data;
}

export async function getCharacters(bookId?: number) {
  const response = await apiClient.get<ApiResponse<Character[]>>("/characters", {
    params: bookId ? { bookId } : undefined
  });

  return ensureCharactersArray(response.data.data);
}

export async function createCharacter(payload: CharacterPayload) {
  const response = await apiClient.post<ApiResponse<Character>>("/characters", payload);
  return response.data.data;
}

export async function updateCharacter(id: number, payload: CharacterPayload) {
  const response = await apiClient.patch<ApiResponse<Character>>(`/characters/${id}`, payload);
  return response.data.data;
}

export async function deleteCharacter(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/characters/${id}`);
  return response.data.data;
}
