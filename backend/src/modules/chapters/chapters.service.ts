import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateChapterDto } from "./dto/create-chapter.dto.js";
import type { ChapterDto } from "./dto/chapter.dto.js";
import type { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { ChaptersRepository } from "./chapters.repository.js";

@Injectable()
export class ChaptersService {
  constructor(
    private readonly chaptersRepository: ChaptersRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<ChapterDto[]> {
    return this.chaptersRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<ChapterDto> {
    const chapter = await this.chaptersRepository.findOne(id);

    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    return chapter;
  }

  async create(payload: CreateChapterDto): Promise<ChapterDto> {
    const created = await this.chaptersRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增章节：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateChapterDto): Promise<ChapterDto> {
    const chapter = await this.chaptersRepository.update(id, payload);

    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    await this.writeAudit(chapter.bookId, String(chapter.id), "update", `更新章节：${chapter.title}`, chapter);
    return chapter;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.chaptersRepository.findOne(id);
    const removed = await this.chaptersRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除章节：${existing.title}`, existing);
    }
    return { success: true };
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "chapter",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
