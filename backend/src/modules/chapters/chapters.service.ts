import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { DeepSeekProvider } from "../../providers/deepseek.provider.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateChapterDto } from "./dto/create-chapter.dto.js";
import type { ChapterDto } from "./dto/chapter.dto.js";
import type { GenerateChapterAiDto } from "./dto/generate-chapter-ai.dto.js";
import type { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { ChaptersRepository } from "./chapters.repository.js";

@Injectable()
export class ChaptersService {
  constructor(
    private readonly chaptersRepository: ChaptersRepository,
    private readonly prismaService: PrismaService,
    private readonly deepSeekProvider: DeepSeekProvider,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(userId: number, bookId?: number): Promise<ChapterDto[]> {
    this.requireUserId(userId);
    if (bookId !== undefined) {
      await this.ensureBookOwned(bookId, userId);
    }
    return this.chaptersRepository.findAll(bookId);
  }

  async findOne(userId: number, id: number): Promise<ChapterDto> {
    this.requireUserId(userId);
    const chapter = await this.chaptersRepository.findOne(id);

    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    await this.ensureBookOwned(chapter.bookId, userId);
    return chapter;
  }

  async create(userId: number, payload: CreateChapterDto): Promise<ChapterDto> {
    this.requireUserId(userId);
    await this.ensureBookOwned(payload.bookId, userId);
    const created = await this.chaptersRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增章节：${created.title}`, created);
    return created;
  }

  async update(userId: number, id: number, payload: UpdateChapterDto): Promise<ChapterDto> {
    this.requireUserId(userId);
    const existing = await this.chaptersRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }
    await this.ensureBookOwned(existing.bookId, userId);
    const chapter = await this.chaptersRepository.update(id, payload);

    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    await this.writeAudit(chapter.bookId, String(chapter.id), "update", `更新章节：${chapter.title}`, chapter);
    return chapter;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    this.requireUserId(userId);
    const existing = await this.chaptersRepository.findOne(id);
    if (existing) {
      await this.ensureBookOwned(existing.bookId, userId);
    }
    const removed = await this.chaptersRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除章节：${existing.title}`, existing);
    }
    return { success: true };
  }

  async generateAi(userId: number, payload: GenerateChapterAiDto) {
    this.requireUserId(userId);
    if (!(await this.deepSeekProvider.isConfigured())) {
      throw new ServiceUnavailableException("DeepSeek API key is not configured.");
    }

    const content = payload.content?.trim() ?? "";
    if (!content) {
      throw new BadRequestException("Content is required.");
    }

    if (payload.mode === "rewrite" && !(payload.instruction ?? "").trim()) {
      throw new BadRequestException("Instruction is required for rewrite mode.");
    }

    const book = await this.ensureBookOwned(payload.bookId, userId);

    if (!book) {
      throw new NotFoundException(`Book ${payload.bookId} not found`);
    }

    const modeLabelMap: Record<GenerateChapterAiDto["mode"], string> = {
      continue: "续写",
      polish: "润色",
      rewrite: "改写"
    };

    const instructionText = (payload.instruction ?? "").trim();

    const completion = await this.deepSeekProvider.createChatCompletion([
      {
        role: "system",
        content: [
          "你是专业的中文长篇小说写作助手。",
          "请只输出纯正文，不要输出 markdown 标题、解释、前言或结尾总结。",
          "保持语言自然、有画面感，避免流水账。",
          "如果需要补充细节，请用行为、对话、环境描写呈现。"
        ].join("\n")
      },
      {
        role: "user",
        content: [
          `作品名：${book.name}`,
          `类型：${book.category}${book.subCategory ? ` / ${book.subCategory}` : ""}`,
          `章节：${payload.chapterNo ? `第 ${payload.chapterNo} 章` : "未指定"}`,
          `标题：${payload.title?.trim() || "未指定"}`,
          `任务：${modeLabelMap[payload.mode]}`,
          instructionText ? `要求：${instructionText}` : "",
          "",
          "以下为当前章节正文（或草稿）：",
          content,
          "",
          payload.mode === "continue"
            ? "请在保持叙事风格一致的前提下续写接下来 600-1200 字左右。"
            : payload.mode === "polish"
              ? "请在不改变剧情信息的前提下润色这段正文，提升节奏、画面感与可读性。"
              : "请按要求重写这段正文，允许调整表达与结构，但不要丢失关键情节信息。"
        ].filter(Boolean).join("\n")
      }
    ]);

    const text = this.normalizeParagraph(completion.choices[0]?.message?.content ?? "");

    if (!text) {
      throw new BadRequestException("AI output is empty.");
    }

    await this.writeAudit(
      payload.bookId,
      payload.chapterId ? String(payload.chapterId) : "",
      `ai_${payload.mode}`,
      `AI ${modeLabelMap[payload.mode]}章节：${payload.title?.trim() || "未命名章节"}`,
      {
        mode: payload.mode,
        chapterId: payload.chapterId,
        chapterNo: payload.chapterNo,
        instruction: instructionText,
        outputLength: text.length
      }
    );

    return { text };
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
      entityType: "chapter",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }

  private normalizeParagraph(value: string) {
    return value
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}
