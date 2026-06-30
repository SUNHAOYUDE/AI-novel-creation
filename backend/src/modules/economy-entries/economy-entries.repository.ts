import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateEconomyEntryDto } from "./dto/create-economy-entry.dto.js";
import type { EconomyEntryDto } from "./dto/economy-entry.dto.js";
import type { UpdateEconomyEntryDto } from "./dto/update-economy-entry.dto.js";

type EconomyEntryEntity = {
  id: bigint | number | string;
  bookId: bigint | number | string;
  bookName: string;
  category: string;
  title: string;
  region: string;
  circulation: string;
  coreValue: string;
  description: string;
  risk: string;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

@Injectable()
export class EconomyEntriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<EconomyEntryDto[]> {
    await this.ensureTable();
    const whereClause = bookId ? "WHERE ee.book_id = ?" : "";
    const params = bookId ? [bookId] : [];
    const rows = await this.prismaService.$queryRawUnsafe<EconomyEntryEntity[]>(
      `
        SELECT
          ee.id,
          ee.book_id AS bookId,
          b.name AS bookName,
          ee.category,
          ee.title,
          COALESCE(ee.region, '') AS region,
          COALESCE(ee.circulation, '') AS circulation,
          COALESCE(ee.core_value, '') AS coreValue,
          COALESCE(ee.description, '') AS description,
          COALESCE(ee.risk, '') AS risk,
          ee.sort_order AS sortOrder,
          ee.created_at AS createdAt,
          ee.updated_at AS updatedAt
        FROM economy_entries ee
        INNER JOIN books b ON b.id = ee.book_id
        ${whereClause}
        ORDER BY ee.sort_order ASC, ee.id ASC
      `,
      ...params
    );

    return rows.map((row) => this.toDto(row));
  }

  async findOne(id: number): Promise<EconomyEntryDto | undefined> {
    await this.ensureTable();
    const rows = await this.prismaService.$queryRawUnsafe<EconomyEntryEntity[]>(
      `
        SELECT
          ee.id,
          ee.book_id AS bookId,
          b.name AS bookName,
          ee.category,
          ee.title,
          COALESCE(ee.region, '') AS region,
          COALESCE(ee.circulation, '') AS circulation,
          COALESCE(ee.core_value, '') AS coreValue,
          COALESCE(ee.description, '') AS description,
          COALESCE(ee.risk, '') AS risk,
          ee.sort_order AS sortOrder,
          ee.created_at AS createdAt,
          ee.updated_at AS updatedAt
        FROM economy_entries ee
        INNER JOIN books b ON b.id = ee.book_id
        WHERE ee.id = ?
        LIMIT 1
      `,
      id
    );

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async create(payload: CreateEconomyEntryDto): Promise<EconomyEntryDto> {
    await this.ensureTable();
    const insertedId = await this.prismaService.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO economy_entries (
            book_id,
            category,
            title,
            region,
            circulation,
            core_value,
            description,
            risk,
            sort_order,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        payload.bookId,
        payload.category,
        payload.title,
        payload.region ?? "",
        payload.circulation ?? "",
        payload.coreValue ?? "",
        payload.description ?? "",
        payload.risk ?? "",
        payload.sortOrder ?? 0
      );

      const inserted = await tx.$queryRawUnsafe<Array<{ id: bigint | number | string }>>(
        "SELECT LAST_INSERT_ID() AS id"
      );

      return this.toNumber(inserted[0]?.id ?? 0);
    });

    return this.findOneOrThrow(insertedId);
  }

  async update(id: number, payload: UpdateEconomyEntryDto): Promise<EconomyEntryDto | undefined> {
    await this.ensureTable();
    const existing = await this.findOne(id);

    if (!existing) {
      return undefined;
    }

    await this.prismaService.$executeRawUnsafe(
      `
        UPDATE economy_entries
        SET
          book_id = ?,
          category = ?,
          title = ?,
          region = ?,
          circulation = ?,
          core_value = ?,
          description = ?,
          risk = ?,
          sort_order = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      payload.bookId ?? existing.bookId,
      payload.category ?? existing.category,
      payload.title ?? existing.title,
      payload.region ?? existing.region,
      payload.circulation ?? existing.circulation,
      payload.coreValue ?? existing.coreValue,
      payload.description ?? existing.description,
      payload.risk ?? existing.risk,
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

    await this.prismaService.$executeRawUnsafe("DELETE FROM economy_entries WHERE id = ?", id);
    return true;
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS economy_entries (
        id BIGINT NOT NULL AUTO_INCREMENT,
        book_id BIGINT NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        region VARCHAR(100) NULL,
        circulation TEXT NULL,
        core_value VARCHAR(255) NULL,
        description LONGTEXT NULL,
        risk TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_economy_entries_book_id (book_id),
        INDEX idx_economy_entries_category (category),
        CONSTRAINT fk_economy_entries_book_id FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  private toDto(row: EconomyEntryEntity): EconomyEntryDto {
    return {
      id: this.toNumber(row.id),
      bookId: this.toNumber(row.bookId),
      bookName: row.bookName,
      category: row.category,
      title: row.title,
      region: row.region,
      circulation: row.circulation,
      coreValue: row.coreValue,
      description: row.description,
      risk: row.risk,
      sortOrder: row.sortOrder,
      createdAt: this.toIsoString(row.createdAt),
      updatedAt: this.toIsoString(row.updatedAt)
    };
  }

  private async findOneOrThrow(id: number): Promise<EconomyEntryDto> {
    const entry = await this.findOne(id);

    if (!entry) {
      throw new Error(`EconomyEntry ${id} not found after write`);
    }

    return entry;
  }

  private toNumber(value: bigint | number | string): number {
    return Number(value);
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
