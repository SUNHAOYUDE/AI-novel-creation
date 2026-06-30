import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsController } from "./audit-logs.controller.js";
import { AuditLogsRepository } from "./audit-logs.repository.js";
import { AuditLogsService } from "./audit-logs.service.js";

@Module({
  controllers: [AuditLogsController],
  providers: [PrismaService, AuditLogsRepository, AuditLogsService],
  exports: [AuditLogsRepository]
})
export class AuditLogsModule {}
