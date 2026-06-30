import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { EconomyEntriesController } from "./economy-entries.controller.js";
import { EconomyEntriesRepository } from "./economy-entries.repository.js";
import { EconomyEntriesService } from "./economy-entries.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [EconomyEntriesController],
  providers: [PrismaService, EconomyEntriesRepository, EconomyEntriesService]
})
export class EconomyEntriesModule {}
