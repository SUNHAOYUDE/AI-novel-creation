import { apiClient } from "@/shared/api/client";
import type { ApiResponse, AuditLog } from "@/shared/types";

function ensureAuditLogsArray(data: AuditLog[]) {
  if (!Array.isArray(data)) {
    throw new Error("审计日志接口返回格式不正确");
  }

  return data;
}

export async function getAuditLogs(options: { bookId?: number; entityType?: string; limit?: number } = {}) {
  const response = await apiClient.get<ApiResponse<AuditLog[]>>("/audit-logs", {
    params: {
      bookId: options.bookId,
      entityType: options.entityType,
      limit: options.limit
    }
  });

  return ensureAuditLogsArray(response.data.data);
}
