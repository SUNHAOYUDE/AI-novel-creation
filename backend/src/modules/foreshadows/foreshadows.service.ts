import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateForeshadowDto } from "./dto/create-foreshadow.dto.js";
import type { ForeshadowDto } from "./dto/foreshadow.dto.js";
import type { UpdateForeshadowDto } from "./dto/update-foreshadow.dto.js";
import { ForeshadowsRepository } from "./foreshadows.repository.js";

@Injectable()
export class ForeshadowsService {
  constructor(
    private readonly foreshadowsRepository: ForeshadowsRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<ForeshadowDto[]> {
    return this.foreshadowsRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<ForeshadowDto> {
    const foreshadow = await this.foreshadowsRepository.findOne(id);

    if (!foreshadow) {
      throw new NotFoundException(`Foreshadow ${id} not found`);
    }

    return foreshadow;
  }

  async create(payload: CreateForeshadowDto): Promise<ForeshadowDto> {
    const created = await this.foreshadowsRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增伏笔：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateForeshadowDto): Promise<ForeshadowDto> {
    const foreshadow = await this.foreshadowsRepository.update(id, payload);

    if (!foreshadow) {
      throw new NotFoundException(`Foreshadow ${id} not found`);
    }

    await this.writeAudit(foreshadow.bookId, String(foreshadow.id), "update", `更新伏笔：${foreshadow.title}`, foreshadow);
    return foreshadow;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.foreshadowsRepository.findOne(id);
    const removed = await this.foreshadowsRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Foreshadow ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除伏笔：${existing.title}`, existing);
    }
    return { success: true };
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "foreshadow",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
