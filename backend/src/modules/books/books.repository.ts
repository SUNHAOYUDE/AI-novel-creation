import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateBookDto } from "./dto/create-book.dto.js";
import type { BookDto } from "./dto/book.dto.js";
import type { UpdateBookDto } from "./dto/update-book.dto.js";

@Injectable()
export class BooksRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<BookDto[]> {
    const books = await this.prismaService.book.findMany({
      orderBy: {
        updatedAt: "desc"
      }
    });

    return books.map((book) => this.toDto(book));
  }

  async findOne(id: number): Promise<BookDto | undefined> {
    const book = await this.prismaService.book.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    return book ? this.toDto(book) : undefined;
  }

  async create(payload: CreateBookDto): Promise<BookDto> {
    const book = await this.prismaService.book.create({
      data: {
        name: payload.name,
        category: payload.category,
        subCategory: payload.subCategory ?? "",
        status: payload.status ?? "draft",
        description: payload.description ?? ""
      }
    });

    return this.toDto(book);
  }

  async update(id: number, payload: UpdateBookDto): Promise<BookDto | undefined> {
    const existing = await this.prismaService.book.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return undefined;
    }

    const book = await this.prismaService.book.update({
      where: {
        id: BigInt(id)
      },
      data: {
        name: payload.name,
        category: payload.category,
        subCategory: payload.subCategory,
        status: payload.status,
        description: payload.description
      }
    });

    return this.toDto(book);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prismaService.book.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return false;
    }

    await this.prismaService.book.delete({
      where: {
        id: BigInt(id)
      }
    });

    return true;
  }

  private toDto(book: {
    id: bigint;
    name: string;
    category: string;
    subCategory: string | null;
    status: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): BookDto {
    return {
      id: Number(book.id),
      name: book.name,
      category: book.category,
      subCategory: book.subCategory ?? "",
      status: book.status,
      description: book.description ?? "",
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString()
    };
  }
}
