import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { ForeshadowsController } from "./foreshadows.controller.js";
import { ForeshadowsRepository } from "./foreshadows.repository.js";
import { ForeshadowsService } from "./foreshadows.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [ForeshadowsController],
  providers: [PrismaService, ForeshadowsRepository, ForeshadowsService]
})
export class ForeshadowsModule {}
