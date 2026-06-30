import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { AuditLogDto, CreateAuditLogDto } from "./dto/audit-log.dto.js";

type AuditLogEntity = {
  id: bigint | number | string;
  bookId: bigint | number | string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  summary: string;
  payloadJson: string | null;
  createdAt: Date | string;
};

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(options: { bookId?: number; entityType?: string; limit?: number } = {}): Promise<AuditLogDto[]> {
    await this.ensureTable();
    const where: string[] = [];
    const params: Array<number | string> = [];

    if (options.bookId) {
      where.push("al.book_id = ?");
      params.push(options.bookId);
    }

    if (options.entityType) {
      where.push("al.entity_type = ?");
      params.push(options.entityType);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    params.push(limit);

    const rows = await this.prismaService.$queryRawUnsafe<AuditLogEntity[]>(
      `
        SELECT
          al.id,
          al.book_id AS bookId,
          al.entity_type AS entityType,
          al.entity_id AS entityId,
          al.action,
          al.summary,
          COALESCE(al.payload_json, '') AS payloadJson,
          al.created_at AS createdAt
        FROM audit_logs al
        ${whereClause}
        ORDER BY al.id DESC
        LIMIT ?
      `,
      ...params
    );

    return rows.map((row) => this.toDto(row));
  }

  async create(payload: CreateAuditLogDto): Promise<void> {
    await this.ensureTable();
    await this.prismaService.$executeRawUnsafe(
      `
        INSERT INTO audit_logs (book_id, entity_type, entity_id, action, summary, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      `,
      payload.bookId ?? null,
      payload.entityType,
      payload.entityId ?? "",
      payload.action,
      payload.summary,
      payload.payloadJson ?? ""
    );
  }

  private toDto(row: AuditLogEntity): AuditLogDto {
    return {
      id: this.toNumber(row.id),
      bookId: row.bookId === null ? null : this.toNumber(row.bookId),
      entityType: row.entityType,
      entityId: row.entityId ?? "",
      action: row.action,
      summary: row.summary,
      payloadJson: row.payloadJson ?? "",
      createdAt: this.toIsoString(row.createdAt)
    };
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT NOT NULL AUTO_INCREMENT,
        book_id BIGINT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) NULL,
        action VARCHAR(50) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        payload_json LONGTEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_audit_logs_book_id (book_id),
        INDEX idx_audit_logs_entity_type (entity_type),
        INDEX idx_audit_logs_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  private toNumber(value: bigint | number | string): number {
    return Number(value);
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
