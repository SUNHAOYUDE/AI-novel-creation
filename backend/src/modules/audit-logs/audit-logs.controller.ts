import { Controller, Get, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { AuditLogsService } from "./audit-logs.service.js";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query("bookId") bookId?: string,
    @Query("entityType") entityType?: string,
    @Query("limit") limit?: string
  ) {
    return ok(await this.auditLogsService.findAll({
      bookId: bookId ? Number(bookId) : undefined,
      entityType: entityType?.trim() ? entityType.trim() : undefined,
      limit: limit ? Number(limit) : undefined
    }));
  }
}
