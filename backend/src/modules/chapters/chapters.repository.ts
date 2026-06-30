import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateChapterDto } from "./dto/create-chapter.dto.js";
import type { ChapterDto } from "./dto/chapter.dto.js";
import type { UpdateChapterDto } from "./dto/update-chapter.dto.js";

type ChapterEntity = {
  id: bigint;
  bookId: bigint;
  chapterNo: number;
  title: string;
  content: string | null;
  status: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  book: {
    name: string;
  };
};

@Injectable()
export class ChaptersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<ChapterDto[]> {
    const chapters = await this.prismaService.chapter.findMany({
      where: bookId ? { bookId: BigInt(bookId) } : undefined,
      include: {
        book: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ chapterNo: "asc" }, { id: "asc" }]
    });

    return chapters.map((item) => this.toDto(item));
  }

  async findOne(id: number): Promise<ChapterDto | undefined> {
    const chapter = await this.prismaService.chapter.findUnique({
      where: {
        id: BigInt(id)
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return chapter ? this.toDto(chapter) : undefined;
  }

  async create(payload: CreateChapterDto): Promise<ChapterDto> {
    const content = payload.content ?? "";
    const chapter = await this.prismaService.chapter.create({
      data: {
        bookId: BigInt(payload.bookId),
        chapterNo: payload.chapterNo,
        title: payload.title,
        content,
        status: payload.status ?? "draft",
        wordCount: this.countWords(content)
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(chapter);
  }

  async update(id: number, payload: UpdateChapterDto): Promise<ChapterDto | undefined> {
    const existing = await this.prismaService.chapter.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return undefined;
    }

    const content = payload.content ?? existing.content ?? "";
    const chapter = await this.prismaService.chapter.update({
      where: {
        id: BigInt(id)
      },
      data: {
        bookId: payload.bookId !== undefined ? BigInt(payload.bookId) : undefined,
        chapterNo: payload.chapterNo,
        title: payload.title,
        content,
        status: payload.status,
        wordCount: this.countWords(content)
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(chapter);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prismaService.chapter.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return false;
    }

    await this.prismaService.chapter.delete({
      where: {
        id: BigInt(id)
      }
    });

    return true;
  }

  private toDto(chapter: ChapterEntity): ChapterDto {
    return {
      id: Number(chapter.id),
      bookId: Number(chapter.bookId),
      bookName: chapter.book.name,
      chapterNo: chapter.chapterNo,
      title: chapter.title,
      content: chapter.content ?? "",
      status: chapter.status,
      wordCount: chapter.wordCount,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString()
    };
  }

  private countWords(content: string): number {
    const normalized = content.trim();

    if (!normalized) {
      return 0;
    }

    return normalized.replace(/\s+/g, "").length;
  }
}
