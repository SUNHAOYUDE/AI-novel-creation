import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateBookDto } from "./dto/create-book.dto.js";
import type { BookDto } from "./dto/book.dto.js";
import type { UpdateBookDto } from "./dto/update-book.dto.js";
import { BooksRepository } from "./books.repository.js";

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly prismaService: PrismaService,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(): Promise<BookDto[]> {
    return this.booksRepository.findAll();
  }

  async findOne(id: number): Promise<BookDto> {
    const book = await this.booksRepository.findOne(id);

    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    return book;
  }

  async create(payload: CreateBookDto): Promise<BookDto> {
    const created = await this.booksRepository.create(payload);
    await this.writeAudit(String(created.id), "create", `新增作品：${created.name}`, created);
    return created;
  }

  async update(id: number, payload: UpdateBookDto): Promise<BookDto> {
    const book = await this.booksRepository.update(id, payload);

    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    await this.writeAudit(String(book.id), "update", `更新作品：${book.name}`, book);
    return book;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.booksRepository.findOne(id);
    const removed = await this.booksRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(String(existing.id), "delete", `删除作品：${existing.name}`, existing);
    }
    return { success: true };
  }

  async getWorkbench() {
    const books = await this.booksRepository.findAll();

    const results = await Promise.all(
      books.map(async (book) => {
        const bookId = BigInt(book.id);
        const [
          backstories,
          maps,
          timeline,
          economy,
          outlines,
          characters,
          foreshadows,
          chapters,
          latestChapter
        ] = await Promise.all([
          this.prismaService.backstory.count({ where: { bookId } }),
          this.prismaService.worldMap.count({ where: { bookId } }),
          this.prismaService.timelineEvent.count({ where: { bookId } }),
          this.prismaService.economyEntry.count({ where: { bookId } }),
          this.prismaService.outline.count({ where: { bookId } }),
          this.prismaService.character.count({ where: { bookId } }),
          this.prismaService.foreshadow.count({ where: { bookId } }),
          this.prismaService.chapter.count({ where: { bookId } }),
          this.prismaService.chapter.findFirst({
            where: { bookId },
            orderBy: { updatedAt: "desc" },
            include: { book: true }
          })
        ]);

        return {
          book,
          counts: {
            backstories,
            maps,
            timeline,
            economy,
            outlines,
            characters,
            foreshadows,
            chapters
          },
          latestChapter: latestChapter
            ? {
              id: Number(latestChapter.id),
              bookId: Number(latestChapter.bookId),
              bookName: latestChapter.book.name,
              chapterNo: latestChapter.chapterNo,
              title: latestChapter.title,
              content: latestChapter.content ?? "",
              status: latestChapter.status,
              wordCount: latestChapter.wordCount,
              createdAt: latestChapter.createdAt.toISOString(),
              updatedAt: latestChapter.updatedAt.toISOString()
            }
            : null
        };
      })
    );

    return results;
  }

  private async writeAudit(entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId: null,
      entityType: "book",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
