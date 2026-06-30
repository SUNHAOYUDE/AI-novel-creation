import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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

  findAll(bookId?: number): Promise<WorldMapDto[]> {
    return this.worldMapsRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<WorldMapDto> {
    const map = await this.worldMapsRepository.findOne(id);

    if (!map) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    return map;
  }

  async create(payload: CreateWorldMapDto): Promise<WorldMapDto> {
    await this.ensureBookExists(payload.bookId);
    const created = await this.worldMapsRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增地图：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateWorldMapDto): Promise<WorldMapDto> {
    if (payload.bookId) {
      await this.ensureBookExists(payload.bookId);
    }

    const map = await this.worldMapsRepository.update(id, payload);

    if (!map) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    await this.writeAudit(map.bookId, String(map.id), "update", `更新地图：${map.title}`, map);
    return map;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.worldMapsRepository.findOne(id);
    const removed = await this.worldMapsRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`World map ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除地图：${existing.title}`, existing);
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
      entityType: "world-map",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
