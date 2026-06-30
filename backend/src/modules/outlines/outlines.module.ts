import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { SystemSettingsModule } from "../system-settings/system-settings.module.js";
import { OutlinesController } from "./outlines.controller.js";
import { OutlinesRepository } from "./outlines.repository.js";
import { OutlinesService } from "./outlines.service.js";

@Module({
  imports: [AuditLogsModule, SystemSettingsModule],
  controllers: [OutlinesController],
  providers: [PrismaService, OutlinesRepository, OutlinesService]
})
export class OutlinesModule {}
