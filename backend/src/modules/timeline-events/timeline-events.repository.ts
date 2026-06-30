import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateTimelineEventDto } from "./dto/create-timeline-event.dto.js";
import type { TimelineEventDto } from "./dto/timeline-event.dto.js";
import type { UpdateTimelineEventDto } from "./dto/update-timeline-event.dto.js";

type TimelineEventEntity = {
  id: bigint | number | string;
  bookId: bigint | number | string;
  bookName: string;
  relatedMapId: bigint | number | string | null;
  relatedMapTitle: string | null;
  era: string;
  timeLabel: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

@Injectable()
export class TimelineEventsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<TimelineEventDto[]> {
    await this.ensureTable();
    const whereClause = bookId ? "WHERE te.book_id = ?" : "";
    const params = bookId ? [bookId] : [];
    const rows = await this.prismaService.$queryRawUnsafe<TimelineEventEntity[]>(
      `
        SELECT
          te.id,
          te.book_id AS bookId,
          b.name AS bookName,
          te.related_map_id AS relatedMapId,
          COALESCE(wm.title, '') AS relatedMapTitle,
          COALESCE(te.era, '') AS era,
          te.time_label AS timeLabel,
          te.title,
          COALESCE(te.description, '') AS description,
          te.sort_order AS sortOrder,
          te.created_at AS createdAt,
          te.updated_at AS updatedAt
        FROM timeline_events te
        INNER JOIN books b ON b.id = te.book_id
        LEFT JOIN world_maps wm ON wm.id = te.related_map_id
        ${whereClause}
        ORDER BY te.sort_order ASC, te.id ASC
      `,
      ...params
    );

    return rows.map((row) => this.toDto(row));
  }

  async findOne(id: number): Promise<TimelineEventDto | undefined> {
    await this.ensureTable();
    const rows = await this.prismaService.$queryRawUnsafe<TimelineEventEntity[]>(
      `
        SELECT
          te.id,
          te.book_id AS bookId,
          b.name AS bookName,
          te.related_map_id AS relatedMapId,
          COALESCE(wm.title, '') AS relatedMapTitle,
          COALESCE(te.era, '') AS era,
          te.time_label AS timeLabel,
          te.title,
          COALESCE(te.description, '') AS description,
          te.sort_order AS sortOrder,
          te.created_at AS createdAt,
          te.updated_at AS updatedAt
        FROM timeline_events te
        INNER JOIN books b ON b.id = te.book_id
        LEFT JOIN world_maps wm ON wm.id = te.related_map_id
        WHERE te.id = ?
        LIMIT 1
      `,
      id
    );

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async create(payload: CreateTimelineEventDto): Promise<TimelineEventDto> {
    await this.ensureTable();
    const insertedId = await this.prismaService.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO timeline_events (
            book_id,
            related_map_id,
            era,
            time_label,
            title,
            description,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        payload.bookId,
        payload.relatedMapId ?? null,
        payload.era ?? "",
        payload.timeLabel,
        payload.title,
        payload.description ?? "",
        payload.sortOrder ?? 0
      );

      const inserted = await tx.$queryRawUnsafe<Array<{ id: bigint | number | string }>>(
        "SELECT LAST_INSERT_ID() AS id"
      );

      return this.toNumber(inserted[0]?.id ?? 0);
    });

    return this.findOneOrThrow(insertedId);
  }

  async update(id: number, payload: UpdateTimelineEventDto): Promise<TimelineEventDto | undefined> {
    await this.ensureTable();
    const existing = await this.findOne(id);

    if (!existing) {
      return undefined;
    }

    await this.prismaService.$executeRawUnsafe(
      `
        UPDATE timeline_events
        SET
          book_id = ?,
          related_map_id = ?,
          era = ?,
          time_label = ?,
          title = ?,
          description = ?,
          sort_order = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      payload.bookId ?? existing.bookId,
      payload.relatedMapId ?? existing.relatedMapId,
      payload.era ?? existing.era,
      payload.timeLabel ?? existing.timeLabel,
      payload.title ?? existing.title,
      payload.description ?? existing.description,
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

    await this.prismaService.$executeRawUnsafe("DELETE FROM timeline_events WHERE id = ?", id);
    return true;
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id BIGINT NOT NULL AUTO_INCREMENT,
        book_id BIGINT NOT NULL,
        related_map_id BIGINT NULL,
        era VARCHAR(100) NULL,
        time_label VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_timeline_events_book_id (book_id),
        INDEX idx_timeline_events_related_map_id (related_map_id),
        CONSTRAINT fk_timeline_events_book_id FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  private toDto(row: TimelineEventEntity): TimelineEventDto {
    return {
      id: this.toNumber(row.id),
      bookId: this.toNumber(row.bookId),
      bookName: row.bookName,
      relatedMapId: row.relatedMapId === null ? null : this.toNumber(row.relatedMapId),
      relatedMapTitle: row.relatedMapTitle ?? "",
      era: row.era,
      timeLabel: row.timeLabel,
      title: row.title,
      description: row.description,
      sortOrder: row.sortOrder,
      createdAt: this.toIsoString(row.createdAt),
      updatedAt: this.toIsoString(row.updatedAt)
    };
  }

  private async findOneOrThrow(id: number): Promise<TimelineEventDto> {
    const event = await this.findOne(id);

    if (!event) {
      throw new Error(`TimelineEvent ${id} not found after write`);
    }

    return event;
  }

  private toNumber(value: bigint | number | string): number {
    return Number(value);
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
