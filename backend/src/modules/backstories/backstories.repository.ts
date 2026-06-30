import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateBackstoryDto } from "./dto/create-backstory.dto.js";
import type { BackstoryDto } from "./dto/backstory.dto.js";
import type { UpdateBackstoryDto } from "./dto/update-backstory.dto.js";

type BackstoryEntity = {
  id: bigint | number | string;
  bookId: bigint | number | string;
  kind: string;
  source: string;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  bookName: string;
};

@Injectable()
export class BackstoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<BackstoryDto[]> {
    await this.ensureTable();
    const whereClause = bookId ? "WHERE bs.book_id = ?" : "";
    const params = bookId ? [bookId] : [];
    const backstories = await this.prismaService.$queryRawUnsafe<BackstoryEntity[]>(
      `
        SELECT
          bs.id,
          bs.book_id AS bookId,
          b.name AS bookName,
          COALESCE(bs.kind, 'history') AS kind,
          COALESCE(bs.source, 'manual') AS source,
          bs.title,
          COALESCE(bs.content, '') AS content,
          bs.sort_order AS sortOrder,
          bs.created_at AS createdAt,
          bs.updated_at AS updatedAt
        FROM backstories bs
        INNER JOIN books b ON b.id = bs.book_id
        ${whereClause}
        ORDER BY bs.sort_order ASC, bs.id ASC
      `,
      ...params
    );

    return backstories.map((item) => this.toDto(item));
  }

  async findOne(id: number): Promise<BackstoryDto | undefined> {
    await this.ensureTable();
    const rows = await this.prismaService.$queryRawUnsafe<BackstoryEntity[]>(
      `
        SELECT
          bs.id,
          bs.book_id AS bookId,
          b.name AS bookName,
          COALESCE(bs.kind, 'history') AS kind,
          COALESCE(bs.source, 'manual') AS source,
          bs.title,
          COALESCE(bs.content, '') AS content,
          bs.sort_order AS sortOrder,
          bs.created_at AS createdAt,
          bs.updated_at AS updatedAt
        FROM backstories bs
        INNER JOIN books b ON b.id = bs.book_id
        WHERE bs.id = ?
        LIMIT 1
      `,
      id
    );
    const backstory = rows[0];

    return backstory ? this.toDto(backstory) : undefined;
  }

  async create(payload: CreateBackstoryDto): Promise<BackstoryDto> {
    await this.ensureTable();
    const insertedId = await this.prismaService.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO backstories (book_id, kind, source, title, content, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        payload.bookId,
        payload.kind ?? "history",
        payload.source ?? "manual",
        payload.title,
        payload.content ?? "",
        payload.sortOrder ?? 0
      );

      const inserted = await tx.$queryRawUnsafe<Array<{ id: bigint | number | string }>>(
        "SELECT LAST_INSERT_ID() AS id"
      );

      return this.toNumber(inserted[0]?.id ?? 0);
    });

    return this.findOneOrThrow(insertedId);
  }

  async createMany(payloads: CreateBackstoryDto[]): Promise<BackstoryDto[]> {
    if (payloads.length === 0) {
      return [];
    }

    await this.ensureTable();

    const insertedIds = await this.prismaService.$transaction(async (tx) => {
      const ids: number[] = [];

      for (const payload of payloads) {
        await tx.$executeRawUnsafe(
          `
            INSERT INTO backstories (book_id, kind, source, title, content, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `,
          payload.bookId,
          payload.kind ?? "history",
          payload.source ?? "manual",
          payload.title,
          payload.content ?? "",
          payload.sortOrder ?? 0
        );

        const inserted = await tx.$queryRawUnsafe<Array<{ id: bigint | number | string }>>(
          "SELECT LAST_INSERT_ID() AS id"
        );
        ids.push(this.toNumber(inserted[0]?.id ?? 0));
      }

      return ids;
    });

    const created = await Promise.all(insertedIds.map((id) => this.findOneOrThrow(id)));
    return created.sort((left, right) => left.sortOrder - right.sortOrder);
  }

  async update(id: number, payload: UpdateBackstoryDto): Promise<BackstoryDto | undefined> {
    await this.ensureTable();
    const existing = await this.findOne(id);

    if (!existing) {
      return undefined;
    }

    await this.prismaService.$executeRawUnsafe(
      `
        UPDATE backstories
        SET
          book_id = ?,
          kind = ?,
          source = ?,
          title = ?,
          content = ?,
          sort_order = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      payload.bookId ?? existing.bookId,
      payload.kind ?? existing.kind,
      payload.source ?? existing.source,
      payload.title ?? existing.title,
      payload.content ?? existing.content,
      payload.sortOrder ?? existing.sortOrder,
      id
    );

    return this.findOne(id);
  }

  async remove(id: number): Promise<boolean> {
    await this.ensureTable();
    const existing = await this.findOne(id);

    if (!existing) {
      return false;
    }

    await this.prismaService.$executeRawUnsafe("DELETE FROM backstories WHERE id = ?", id);

    return true;
  }

  private toDto(backstory: BackstoryEntity): BackstoryDto {
    return {
      id: this.toNumber(backstory.id),
      bookId: this.toNumber(backstory.bookId),
      bookName: backstory.bookName,
      kind: backstory.kind,
      source: backstory.source,
      title: backstory.title,
      content: backstory.content,
      sortOrder: backstory.sortOrder,
      createdAt: this.toIsoString(backstory.createdAt),
      updatedAt: this.toIsoString(backstory.updatedAt)
    };
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS backstories (
        id BIGINT NOT NULL AUTO_INCREMENT,
        book_id BIGINT NOT NULL,
        kind VARCHAR(50) NOT NULL DEFAULT 'history',
        source VARCHAR(50) NOT NULL DEFAULT 'manual',
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_backstories_book_id (book_id),
        CONSTRAINT fk_backstories_book_id FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.ensureColumn("kind", `
      ALTER TABLE backstories
      ADD COLUMN kind VARCHAR(50) NOT NULL DEFAULT 'history' AFTER book_id
    `);

    await this.ensureColumn("source", `
      ALTER TABLE backstories
      ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'manual' AFTER kind
    `);

    await this.prismaService.$executeRawUnsafe(`
      ALTER TABLE backstories
      MODIFY COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      MODIFY COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    `);
  }

  private async findOneOrThrow(id: number): Promise<BackstoryDto> {
    const backstory = await this.findOne(id);

    if (!backstory) {
      throw new Error(`Backstory ${id} not found after write`);
    }

    return backstory;
  }

  private toNumber(value: bigint | number | string): number {
    return Number(value);
  }

  private async columnExists(columnName: string): Promise<boolean> {
    const rows = await this.prismaService.$queryRawUnsafe<Array<{ total: bigint | number | string }>>(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'backstories'
          AND column_name = ?
      `,
      columnName
    );

    return this.toNumber(rows[0]?.total ?? 0) > 0;
  }

  private async ensureColumn(columnName: string, statement: string) {
    if (await this.columnExists(columnName)) {
      return;
    }

    try {
      await this.prismaService.$executeRawUnsafe(statement);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.includes("Duplicate column name")) {
        throw error;
      }
    }
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
