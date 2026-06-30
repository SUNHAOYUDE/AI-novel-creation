import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { WorldMapsController } from "./world-maps.controller.js";
import { WorldMapsRepository } from "./world-maps.repository.js";
import { WorldMapsService } from "./world-maps.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [WorldMapsController],
  providers: [PrismaService, WorldMapsRepository, WorldMapsService]
})
export class WorldMapsModule {}
