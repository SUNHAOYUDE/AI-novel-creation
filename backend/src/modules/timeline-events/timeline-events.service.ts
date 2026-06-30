import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
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

  async findAll(userId: number, bookId?: number): Promise<TimelineEventDto[]> {
    this.requireUserId(userId);
    if (bookId !== undefined) {
      await this.ensureBookOwned(bookId, userId);
    }
    return this.timelineEventsRepository.findAll(bookId);
  }

  async findOne(userId: number, id: number): Promise<TimelineEventDto> {
    this.requireUserId(userId);
    const event = await this.timelineEventsRepository.findOne(id);

    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    await this.ensureBookOwned(event.bookId, userId);
    return event;
  }

  async create(userId: number, payload: CreateTimelineEventDto): Promise<TimelineEventDto> {
    this.requireUserId(userId);
    await this.ensureBookOwned(payload.bookId, userId);
    const created = await this.timelineEventsRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增时间线事件：${created.title}`, created);
    return created;
  }

  async update(userId: number, id: number, payload: UpdateTimelineEventDto): Promise<TimelineEventDto> {
    this.requireUserId(userId);
    const existing = await this.timelineEventsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }
    await this.ensureBookOwned(existing.bookId, userId);

    const event = await this.timelineEventsRepository.update(id, payload);

    if (!event) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    await this.writeAudit(event.bookId, String(event.id), "update", `更新时间线事件：${event.title}`, event);
    return event;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    this.requireUserId(userId);
    const existing = await this.timelineEventsRepository.findOne(id);
    if (existing) {
      await this.ensureBookOwned(existing.bookId, userId);
    }
    const removed = await this.timelineEventsRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Timeline event ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除时间线事件：${existing.title}`, existing);
    }
    return { success: true };
  }

  private async ensureBookOwned(bookId: number, userId: number) {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      throw new BadRequestException("bookId is invalid.");
    }

    const book = await this.prismaService.book.findFirst({
      where: {
        id: BigInt(bookId),
        ownerId: BigInt(userId)
      }
    });

    if (!book) {
      throw new NotFoundException(`Book ${bookId} not found`);
    }

    return book;
  }

  private requireUserId(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new UnauthorizedException("Unauthorized");
    }
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
