import { Injectable } from "@nestjs/common";
import type { AuditLogDto } from "./dto/audit-log.dto.js";
import { AuditLogsRepository } from "./audit-logs.repository.js";

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  findAll(options: { bookId?: number; entityType?: string; limit?: number }): Promise<AuditLogDto[]> {
    return this.auditLogsRepository.findAll(options);
  }
}
