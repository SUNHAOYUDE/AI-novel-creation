import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { DeepSeekProvider } from "../../providers/deepseek.provider.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateBackstoryDto } from "./dto/create-backstory.dto.js";
import type { BackstoryDto } from "./dto/backstory.dto.js";
import type { GenerateBackstoriesDto } from "./dto/generate-backstories.dto.js";
import type { UpdateBackstoryDto } from "./dto/update-backstory.dto.js";
import { BackstoriesRepository } from "./backstories.repository.js";

type GeneratedBackstoryResult = {
  items: Array<{
    kind: string;
    title: string;
    content: string;
  }>;
};

@Injectable()
export class BackstoriesService {
  constructor(
    private readonly backstoriesRepository: BackstoriesRepository,
    private readonly prismaService: PrismaService,
    private readonly deepSeekProvider: DeepSeekProvider,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<BackstoryDto[]> {
    return this.backstoriesRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<BackstoryDto> {
    const backstory = await this.backstoriesRepository.findOne(id);

    if (!backstory) {
      throw new NotFoundException(`Backstory ${id} not found`);
    }

    return backstory;
  }

  async create(payload: CreateBackstoryDto): Promise<BackstoryDto> {
    await this.ensureBookExists(payload.bookId);
    const created = await this.backstoriesRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增设定：${created.title}`, created);
    return created;
  }

  async update(id: number, payload: UpdateBackstoryDto): Promise<BackstoryDto> {
    if (payload.bookId) {
      await this.ensureBookExists(payload.bookId);
    }

    const backstory = await this.backstoriesRepository.update(id, payload);

    if (!backstory) {
      throw new NotFoundException(`Backstory ${id} not found`);
    }

    await this.writeAudit(backstory.bookId, String(backstory.id), "update", `更新设定：${backstory.title}`, backstory);
    return backstory;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.backstoriesRepository.findOne(id);
    const removed = await this.backstoriesRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Backstory ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除设定：${existing.title}`, existing);
    }
    return { success: true };
  }

  async generate(payload: GenerateBackstoriesDto): Promise<BackstoryDto[]> {
    if (!(await this.deepSeekProvider.isConfigured())) {
      throw new ServiceUnavailableException("DeepSeek API key is not configured.");
    }

    if (!payload.prompt.trim()) {
      throw new BadRequestException("Prompt is required.");
    }

    const book = await this.ensureBookExists(payload.bookId);
    const currentItems = await this.backstoriesRepository.findAll(payload.bookId);
    const count = Math.min(Math.max(payload.count ?? 4, 1), 8);

    const completion = await this.deepSeekProvider.createChatCompletion([
      {
        role: "system",
        content: [
          "你是专业的中文小说世界观策划编辑。",
          "请根据作品信息生成可直接入库的背景设定。",
          "只输出 JSON，不要输出 markdown、解释、前言或结尾。",
          'JSON 格式必须为 {"items":[{"kind":"history|rule|culture|faction|secret","title":"","content":""}]}。',
          `请生成 ${count} 条设定，必须同时覆盖背景故事和世界规则。`,
          "内容要具体、可用于后续大纲、地图和时间线继续扩展。"
        ].join("\n")
      },
      {
        role: "user",
        content: [
          `作品名：${book.name}`,
          `主类型：${book.category}`,
          `子类型：${book.subCategory ?? "未设置"}`,
          `作品简介：${book.description ?? "暂无简介"}`,
          `生成提示词：${payload.prompt}`,
          `重点方向：${payload.focus?.trim() || "优先补齐时代背景、底层规则、关键历史与势力格局"}`,
          "请让设定之间有时间递进、因果关系与可继续延展的空间。"
        ].join("\n")
      }
    ]);

    const content = completion.choices[0]?.message?.content ?? "";
    const parsed = this.parseGeneratedResult(content);
    const nextSortOrder = currentItems.length + 1;

    const created = await this.backstoriesRepository.createMany(
      parsed.items.map((item, index) => ({
        bookId: payload.bookId,
        kind: this.normalizeKind(item.kind),
        source: "ai",
        title: item.title.trim(),
        content: item.content.trim(),
        sortOrder: nextSortOrder + index
      }))
    );

    await this.writeAudit(payload.bookId, "", "generate", `AI 生成设定：${created.length} 条`, created);
    return created;
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

  private parseGeneratedResult(content: string): GeneratedBackstoryResult {
    const normalized = content.trim();
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1] ?? normalized;
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    const jsonText = objectMatch?.[0] ?? candidate;

    try {
      const parsed = JSON.parse(jsonText) as GeneratedBackstoryResult;

      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error("Generated result is missing items.");
      }

      return parsed;
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      throw new BadRequestException(`Failed to parse DeepSeek backstory result: ${message}`);
    }
  }

  private normalizeKind(kind: string) {
    const normalized = kind.trim().toLowerCase();
    const supportedKinds = new Set(["history", "rule", "culture", "faction", "secret"]);
    return supportedKinds.has(normalized) ? normalized : "history";
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "backstory",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
