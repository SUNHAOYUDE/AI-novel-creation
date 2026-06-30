import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { DeepSeekProvider } from "../../providers/deepseek.provider.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateOutlineDto } from "./dto/create-outline.dto.js";
import type { GenerateOutlineDto } from "./dto/generate-outline.dto.js";
import type { OutlineDto } from "./dto/outline.dto.js";
import type { UpdateOutlineDto } from "./dto/update-outline.dto.js";
import { OutlinesRepository } from "./outlines.repository.js";

type GeneratedOutlineResult = {
  global_outline: {
    title: string;
    summary: string;
  };
  volume_outlines: Array<{
    title: string;
    summary: string;
  }>;
  chapter_outlines: Array<{
    title: string;
    summary: string;
  }>;
};

@Injectable()
export class OutlinesService {
  constructor(
    private readonly outlinesRepository: OutlinesRepository,
    private readonly prismaService: PrismaService,
    private readonly deepSeekProvider: DeepSeekProvider,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(userId: number, bookId?: number): Promise<OutlineDto[]> {
    this.requireUserId(userId);
    if (bookId !== undefined) {
      await this.ensureBookOwned(bookId, userId);
    }
    return this.outlinesRepository.findAll(bookId);
  }

  async findOne(userId: number, id: number): Promise<OutlineDto> {
    this.requireUserId(userId);
    const outline = await this.outlinesRepository.findOne(id);

    if (!outline) {
      throw new NotFoundException(`Outline ${id} not found`);
    }

    await this.ensureBookOwned(outline.bookId, userId);
    return outline;
  }

  async create(userId: number, payload: CreateOutlineDto): Promise<OutlineDto> {
    this.requireUserId(userId);
    await this.ensureBookOwned(payload.bookId, userId);
    const created = await this.outlinesRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增大纲：${created.title}`, created);
    return created;
  }

  async update(userId: number, id: number, payload: UpdateOutlineDto): Promise<OutlineDto> {
    this.requireUserId(userId);
    const existing = await this.outlinesRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Outline ${id} not found`);
    }
    await this.ensureBookOwned(existing.bookId, userId);
    const outline = await this.outlinesRepository.update(id, payload);

    if (!outline) {
      throw new NotFoundException(`Outline ${id} not found`);
    }

    await this.writeAudit(outline.bookId, String(outline.id), "update", `更新大纲：${outline.title}`, outline);
    return outline;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    this.requireUserId(userId);
    const existing = await this.outlinesRepository.findOne(id);
    if (existing) {
      await this.ensureBookOwned(existing.bookId, userId);
    }
    const removed = await this.outlinesRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Outline ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除大纲：${existing.title}`, existing);
    }
    return { success: true };
  }

  async generate(userId: number, payload: GenerateOutlineDto): Promise<OutlineDto[]> {
    this.requireUserId(userId);
    if (!(await this.deepSeekProvider.isConfigured())) {
      throw new ServiceUnavailableException("DeepSeek API key is not configured.");
    }

    if (!payload.premise.trim()) {
      throw new BadRequestException("Premise is required.");
    }

    const book = await this.prismaService.book.findFirst({
      where: {
        id: BigInt(payload.bookId),
        ownerId: BigInt(userId)
      }
    });

    if (!book) {
      throw new NotFoundException(`Book ${payload.bookId} not found`);
    }

    const completion = await this.deepSeekProvider.createChatCompletion([
      {
        role: "system",
        content: [
          "你是专业的中文小说策划编辑。",
          "请根据给定作品信息生成结构化大纲。",
          "只输出 JSON，不要输出 markdown、解释、前言或结尾。",
          'JSON 格式必须为 {"global_outline":{"title":"","summary":""},"volume_outlines":[{"title":"","summary":""}],"chapter_outlines":[{"title":"","summary":""}]}。',
          "要求生成 1 条总纲、3 条卷纲、6 条章纲。",
          "内容要有类型感、冲突递进、记忆点和可连载性。"
        ].join("\n")
      },
      {
        role: "user",
        content: [
          `作品名：${book.name}`,
          `主类型：${book.category}`,
          `子类型：${book.subCategory ?? "未设置"}`,
          `作品简介：${book.description ?? "暂无简介"}`,
          `创作 premise：${payload.premise}`,
          `目标风格：${payload.targetTone?.trim() || "强节奏、可读性高、适合连载"}`,
          `特殊记忆点：${payload.specialHook?.trim() || "请自行补足作品独特记忆点"}`,
          `附加要求：${payload.requirements?.trim() || "请突出伏笔、类型爽点和后续展开空间"}`
        ].join("\n")
      }
    ]);

    const content = completion.choices[0]?.message?.content ?? "";
    const parsed = this.parseGeneratedResult(content);

    const items: Omit<CreateOutlineDto, "bookId">[] = [
      {
        level: "global",
        title: parsed.global_outline.title,
        summary: parsed.global_outline.summary,
        status: "generated",
        sortOrder: 1
      },
      ...parsed.volume_outlines.map((item, index) => ({
        level: "volume" as const,
        title: item.title,
        summary: item.summary,
        status: "generated",
        sortOrder: index + 2
      })),
      ...parsed.chapter_outlines.map((item, index) => ({
        level: "chapter" as const,
        title: item.title,
        summary: item.summary,
        status: "generated",
        sortOrder: index + 2 + parsed.volume_outlines.length
      }))
    ];

    const created = await this.outlinesRepository.replaceByBook(payload.bookId, items);
    await this.writeAudit(payload.bookId, "", "generate", `AI 生成大纲：${created.length} 条`, created);
    return created;
  }

  private parseGeneratedResult(content: string): GeneratedOutlineResult {
    const normalized = content.trim();
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1] ?? normalized;
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    const jsonText = objectMatch?.[0] ?? candidate;

    try {
      const parsed = JSON.parse(jsonText) as GeneratedOutlineResult;

      if (
        !parsed.global_outline?.title ||
        !parsed.global_outline?.summary ||
        !Array.isArray(parsed.volume_outlines) ||
        !Array.isArray(parsed.chapter_outlines)
      ) {
        throw new Error("Generated outline JSON is missing required fields.");
      }

      return parsed;
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      throw new BadRequestException(`Failed to parse DeepSeek outline result: ${message}`);
    }
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "outline",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
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
  }

  private requireUserId(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new UnauthorizedException("Unauthorized");
    }
  }
}
