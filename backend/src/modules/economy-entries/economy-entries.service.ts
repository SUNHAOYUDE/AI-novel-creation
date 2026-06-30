import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateEconomyEntryDto } from "./dto/create-economy-entry.dto.js";
import type { EconomyEntryDto } from "./dto/economy-entry.dto.js";
import type { UpdateEconomyEntryDto } from "./dto/update-economy-entry.dto.js";
import { EconomyEntriesRepository } from "./economy-entries.repository.js";

@Injectable()
export class EconomyEntriesService {
  constructor(
    private readonly economyEntriesRepository: EconomyEntriesRepository,
    private readonly prismaService: PrismaService,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<EconomyEntryDto[]> {
    return this.economyEntriesRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<EconomyEntryDto> {
    const entry = await this.economyEntriesRepository.findOne(id);

    if (!entry) {
      throw new NotFoundException(`Economy entry ${id} not found`);
    }

    return entry;
  }

  async create(payload: CreateEconomyEntryDto): Promise<EconomyEntryDto> {
    await this.ensureBookExists(payload.bookId);
    const created = await this.economyEntriesRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增经济条目：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateEconomyEntryDto): Promise<EconomyEntryDto> {
    if (payload.bookId) {
      await this.ensureBookExists(payload.bookId);
    }

    const entry = await this.economyEntriesRepository.update(id, payload);

    if (!entry) {
      throw new NotFoundException(`Economy entry ${id} not found`);
    }

    await this.writeAudit(entry.bookId, String(entry.id), "update", `更新经济条目：${entry.title}`, entry);
    return entry;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.economyEntriesRepository.findOne(id);
    const removed = await this.economyEntriesRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Economy entry ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除经济条目：${existing.title}`, existing);
    }
    return { success: true };
  }

  private async ensureBookExists(bookId: number) {
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
      entityType: "economy-entry",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
