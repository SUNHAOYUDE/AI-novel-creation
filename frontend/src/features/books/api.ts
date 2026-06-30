import { apiClient } from "@/shared/api/client";
import type { ApiResponse, Book, BookPayload } from "@/shared/types";

export async function getBooks() {
  const response = await apiClient.get<ApiResponse<Book[]>>("/books");
  const books = response.data.data;

  if (!Array.isArray(books)) {
    throw new Error("作品列表接口返回格式不正确");
  }

  return books;
}

export async function getBook(id: number | null) {
  if (id === null) {
    throw new Error("缺少作品 ID");
  }

  const response = await apiClient.get<ApiResponse<Book>>(`/books/${id}`);
  return response.data.data;
}

export async function createBook(payload: BookPayload) {
  const response = await apiClient.post<ApiResponse<Book>>("/books", payload);
  return response.data.data;
}

export async function updateBook(id: number, payload: BookPayload) {
  const response = await apiClient.patch<ApiResponse<Book>>(`/books/${id}`, payload);
  return response.data.data;
}

export async function deleteBook(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/books/${id}`);
  return response.data.data;
}
