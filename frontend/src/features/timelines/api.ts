import { apiClient } from "@/shared/api/client";
import type { ApiResponse, TimelineEvent, TimelineEventPayload } from "@/shared/types";

function ensureTimelineEventsArray(data: TimelineEvent[]) {
  if (!Array.isArray(data)) {
    throw new Error("时间线接口返回格式不正确");
  }

  return data;
}

export async function getTimelineEvents(bookId?: number) {
  const response = await apiClient.get<ApiResponse<TimelineEvent[]>>("/timeline-events", {
    params: bookId ? { bookId } : undefined
  });

  return ensureTimelineEventsArray(response.data.data);
}

export async function createTimelineEvent(payload: TimelineEventPayload) {
  const response = await apiClient.post<ApiResponse<TimelineEvent>>("/timeline-events", payload);
  return response.data.data;
}

export async function updateTimelineEvent(id: number, payload: TimelineEventPayload) {
  const response = await apiClient.patch<ApiResponse<TimelineEvent>>(`/timeline-events/${id}`, payload);
  return response.data.data;
}

export async function deleteTimelineEvent(id: number) {
  const response = await apiClient.delete<ApiResponse<{ success: true }>>(`/timeline-events/${id}`);
  return response.data.data;
}
