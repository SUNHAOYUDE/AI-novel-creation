import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { SystemSettingsModule } from "../system-settings/system-settings.module.js";
import { ChaptersController } from "./chapters.controller.js";
import { ChaptersRepository } from "./chapters.repository.js";
import { ChaptersService } from "./chapters.service.js";

@Module({
  imports: [AuditLogsModule, SystemSettingsModule],
  controllers: [ChaptersController],
  providers: [PrismaService, ChaptersRepository, ChaptersService]
})
export class ChaptersModule {}
