import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateForeshadowDto } from "./dto/create-foreshadow.dto.js";
import type { ForeshadowDto } from "./dto/foreshadow.dto.js";
import type { UpdateForeshadowDto } from "./dto/update-foreshadow.dto.js";

type ForeshadowEntity = {
  id: bigint;
  bookId: bigint;
  title: string;
  surfaceInfo: string | null;
  realIntent: string | null;
  targetPayoff: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  book: {
    name: string;
  };
};

@Injectable()
export class ForeshadowsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<ForeshadowDto[]> {
    const foreshadows = await this.prismaService.foreshadow.findMany({
      where: bookId ? { bookId: BigInt(bookId) } : undefined,
      include: {
        book: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });

    return foreshadows.map((item) => this.toDto(item));
  }

  async findOne(id: number): Promise<ForeshadowDto | undefined> {
    const foreshadow = await this.prismaService.foreshadow.findUnique({
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

    return foreshadow ? this.toDto(foreshadow) : undefined;
  }

  async create(payload: CreateForeshadowDto): Promise<ForeshadowDto> {
    const foreshadow = await this.prismaService.foreshadow.create({
      data: {
        bookId: BigInt(payload.bookId),
        title: payload.title,
        surfaceInfo: payload.surfaceInfo ?? "",
        realIntent: payload.realIntent ?? "",
        targetPayoff: payload.targetPayoff ?? "",
        status: payload.status ?? "planned"
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(foreshadow);
  }

  async update(id: number, payload: UpdateForeshadowDto): Promise<ForeshadowDto | undefined> {
    const existing = await this.prismaService.foreshadow.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return undefined;
    }

    const foreshadow = await this.prismaService.foreshadow.update({
      where: {
        id: BigInt(id)
      },
      data: {
        bookId: payload.bookId !== undefined ? BigInt(payload.bookId) : undefined,
        title: payload.title,
        surfaceInfo: payload.surfaceInfo,
        realIntent: payload.realIntent,
        targetPayoff: payload.targetPayoff,
        status: payload.status
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(foreshadow);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prismaService.foreshadow.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return false;
    }

    await this.prismaService.foreshadow.delete({
      where: {
        id: BigInt(id)
      }
    });

    return true;
  }

  private toDto(foreshadow: ForeshadowEntity): ForeshadowDto {
    return {
      id: Number(foreshadow.id),
      bookId: Number(foreshadow.bookId),
      bookName: foreshadow.book.name,
      title: foreshadow.title,
      surfaceInfo: foreshadow.surfaceInfo ?? "",
      realIntent: foreshadow.realIntent ?? "",
      targetPayoff: foreshadow.targetPayoff ?? "",
      status: foreshadow.status,
      createdAt: foreshadow.createdAt.toISOString(),
      updatedAt: foreshadow.updatedAt.toISOString()
    };
  }
}
