export type AuditLogDto = {
  id: number;
  bookId: number | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  payloadJson: string;
  createdAt: string;
};

export type CreateAuditLogDto = {
  bookId?: number | null;
  entityType: string;
  entityId?: string;
  action: string;
  summary: string;
  payloadJson?: string;
};
