import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { TimelineEventsController } from "./timeline-events.controller.js";
import { TimelineEventsRepository } from "./timeline-events.repository.js";
import { TimelineEventsService } from "./timeline-events.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [TimelineEventsController],
  providers: [PrismaService, TimelineEventsRepository, TimelineEventsService]
})
export class TimelineEventsModule {}
