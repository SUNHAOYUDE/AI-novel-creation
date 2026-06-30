import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { DeepSeekProvider } from "../../providers/deepseek.provider.js";
import { SystemSettingsController } from "./system-settings.controller.js";
import { SystemSettingsRepository } from "./system-settings.repository.js";
import { SystemSettingsService } from "./system-settings.service.js";

@Module({
  controllers: [SystemSettingsController],
  providers: [PrismaService, SystemSettingsRepository, SystemSettingsService, DeepSeekProvider],
  exports: [SystemSettingsRepository, SystemSettingsService, DeepSeekProvider]
})
export class SystemSettingsModule {}
