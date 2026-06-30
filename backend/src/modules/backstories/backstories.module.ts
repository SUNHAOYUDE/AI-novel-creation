import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { SystemSettingsModule } from "../system-settings/system-settings.module.js";
import { BackstoriesController } from "./backstories.controller.js";
import { BackstoriesRepository } from "./backstories.repository.js";
import { BackstoriesService } from "./backstories.service.js";

@Module({
  imports: [AuditLogsModule, SystemSettingsModule],
  controllers: [BackstoriesController],
  providers: [PrismaService, BackstoriesRepository, BackstoriesService]
})
export class BackstoriesModule {}
