import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateTimelineEventDto } from "./dto/create-timeline-event.dto.js";
import type { TimelineEventDto } from "./dto/timeline-event.dto.js";
import type { UpdateTimelineEventDto } from "./dto/update-timeline-event.dto.js";
import { TimelineEventsRepository } from "./timeline-events.repository.js";

@Injectable()
export class TimelineEventsService {
  constructor(
    private readonly timelineEventsRepository: TimelineEventsRepository,
    private readonly prismaService: PrismaService,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<TimelineEventDto[]> {
    return this.timelineEventsRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<TimelineEventDto> {
    const event = await this.timelineEventsRepository.findOne(id);

    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    return event;
  }

  async create(payload: CreateTimelineEventDto): Promise<TimelineEventDto> {
    await this.ensureBookExists(payload.bookId);
    const created = await this.timelineEventsRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增时间线事件：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateTimelineEventDto): Promise<TimelineEventDto> {
    if (payload.bookId) {
      await this.ensureBookExists(payload.bookId);
    }

    const event = await this.timelineEventsRepository.update(id, payload);

    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    await this.writeAudit(event.bookId, String(event.id), "update", `更新时间线事件：${event.title}`, event);
    return event;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.timelineEventsRepository.findOne(id);
    const removed = await this.timelineEventsRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除时间线事件：${existing.title}`, existing);
    }
    return { success: true };
  }

  private async ensureBookExists(bookId: number) {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      throw new BadRequestException("bookId is invalid.");
    }

    const book = await this.prismaService.book.findUnique({
      where: {
        id: BigInt(bookId)
      }
    });

    if (!book) {
      throw new NotFoundException(`Book ${bookId} not found`);
    }

    return book;
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "timeline-event",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
