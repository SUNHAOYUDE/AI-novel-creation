import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateWorldMapDto } from "./dto/create-world-map.dto.js";
import type { UpdateWorldMapDto } from "./dto/update-world-map.dto.js";
import type { WorldMapDto } from "./dto/world-map.dto.js";
import { WorldMapsRepository } from "./world-maps.repository.js";

@Injectable()
export class WorldMapsService {
  constructor(
    private readonly worldMapsRepository: WorldMapsRepository,
    private readonly prismaService: PrismaService,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(userId: number, bookId?: number): Promise<WorldMapDto[]> {
    this.requireUserId(userId);
    if (bookId !== undefined) {
      await this.ensureBookOwned(bookId, userId);
    }
    return this.worldMapsRepository.findAll(bookId);
  }

  async findOne(userId: number, id: number): Promise<WorldMapDto> {
    this.requireUserId(userId);
    const map = await this.worldMapsRepository.findOne(id);

    if (!map) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    await this.ensureBookOwned(map.bookId, userId);
    return map;
  }

  async create(userId: number, payload: CreateWorldMapDto): Promise<WorldMapDto> {
    this.requireUserId(userId);
    await this.ensureBookOwned(payload.bookId, userId);
    const created = await this.worldMapsRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增地图：${created.title}`, created);
    return created;
  }

  async update(userId: number, id: number, payload: UpdateWorldMapDto): Promise<WorldMapDto> {
    this.requireUserId(userId);
    const existing = await this.worldMapsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`World map ${id} not found`);
    }
    await this.ensureBookOwned(existing.bookId, userId);

    const map = await this.worldMapsRepository.update(id, payload);

    if (!map) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    await this.writeAudit(map.bookId, String(map.id), "update", `更新地图：${map.title}`, map);
    return map;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    this.requireUserId(userId);
    const existing = await this.worldMapsRepository.findOne(id);
    if (existing) {
      await this.ensureBookOwned(existing.bookId, userId);
    }
    const removed = await this.worldMapsRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除地图：${existing.title}`, existing);
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
      entityType: "world-map",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
