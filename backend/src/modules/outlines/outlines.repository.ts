import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateOutlineDto } from "./dto/create-outline.dto.js";
import type { OutlineDto } from "./dto/outline.dto.js";
import type { UpdateOutlineDto } from "./dto/update-outline.dto.js";

type OutlineEntity = {
  id: bigint;
  bookId: bigint;
  level: string;
  title: string;
  summary: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OutlinesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<OutlineDto[]> {
    const outlines = await this.prismaService.outline.findMany({
      where: bookId ? { bookId: BigInt(bookId) } : undefined,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    });

    return outlines.map((item) => this.toDto(item));
  }

  async findOne(id: number): Promise<OutlineDto | undefined> {
    const outline = await this.prismaService.outline.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    return outline ? this.toDto(outline) : undefined;
  }

  async create(payload: CreateOutlineDto): Promise<OutlineDto> {
    const outline = await this.prismaService.outline.create({
      data: {
        bookId: BigInt(payload.bookId),
        level: payload.level,
        title: payload.title,
        summary: payload.summary ?? "",
        status: payload.status ?? "draft",
        sortOrder: payload.sortOrder ?? 0
      }
    });

    return this.toDto(outline);
  }

  async update(id: number, payload: UpdateOutlineDto): Promise<OutlineDto | undefined> {
    const existing = await this.prismaService.outline.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return undefined;
    }

    const outline = await this.prismaService.outline.update({
      where: {
        id: BigInt(id)
      },
      data: {
        level: payload.level,
        title: payload.title,
        summary: payload.summary,
        status: payload.status,
        sortOrder: payload.sortOrder
      }
    });

    return this.toDto(outline);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prismaService.outline.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return false;
    }

    await this.prismaService.outline.delete({
      where: {
        id: BigInt(id)
      }
    });

    return true;
  }

  async replaceByBook(bookId: number, items: Omit<CreateOutlineDto, "bookId">[]): Promise<OutlineDto[]> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.outline.deleteMany({
        where: {
          bookId: BigInt(bookId)
        }
      });

      if (items.length > 0) {
        await tx.outline.createMany({
          data: items.map((item, index) => ({
            bookId: BigInt(bookId),
            level: item.level,
            title: item.title,
            summary: item.summary ?? "",
            status: item.status ?? "generated",
            sortOrder: item.sortOrder ?? index + 1
          }))
        });
      }
    });

    return this.findAll(bookId);
  }

  private toDto(outline: OutlineEntity): OutlineDto {
    return {
      id: Number(outline.id),
      bookId: Number(outline.bookId),
      level: outline.level as OutlineDto["level"],
      title: outline.title,
      summary: outline.summary ?? "",
      status: outline.status,
      sortOrder: outline.sortOrder,
      createdAt: outline.createdAt.toISOString(),
      updatedAt: outline.updatedAt.toISOString()
    };
  }
}
