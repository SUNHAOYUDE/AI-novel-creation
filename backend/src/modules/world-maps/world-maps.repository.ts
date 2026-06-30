import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateWorldMapDto } from "./dto/create-world-map.dto.js";
import type { UpdateWorldMapDto } from "./dto/update-world-map.dto.js";
import type { MapMarkerDto, WorldMapDto } from "./dto/world-map.dto.js";

type WorldMapEntity = {
  id: bigint | number | string;
  bookId: bigint | number | string;
  bookName: string;
  parentId: bigint | number | string | null;
  parentTitle: string | null;
  title: string;
  mapType: string;
  description: string;
  width: number;
  height: number;
  sortOrder: number;
  markersJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

@Injectable()
export class WorldMapsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<WorldMapDto[]> {
    await this.ensureTable();
    const whereClause = bookId ? "WHERE wm.book_id = ?" : "";
    const params = bookId ? [bookId] : [];
    const rows = await this.prismaService.$queryRawUnsafe<WorldMapEntity[]>(
      `
        SELECT
          wm.id,
          wm.book_id AS bookId,
          b.name AS bookName,
          wm.parent_id AS parentId,
          parent.title AS parentTitle,
          wm.title,
          wm.map_type AS mapType,
          COALESCE(wm.description, '') AS description,
          wm.width,
          wm.height,
          wm.sort_order AS sortOrder,
          COALESCE(wm.markers_json, '[]') AS markersJson,
          wm.created_at AS createdAt,
          wm.updated_at AS updatedAt
        FROM world_maps wm
        INNER JOIN books b ON b.id = wm.book_id
        LEFT JOIN world_maps parent ON parent.id = wm.parent_id
        ${whereClause}
        ORDER BY wm.sort_order ASC, wm.id ASC
      `,
      ...params
    );

    return rows.map((row) => this.toDto(row));
  }

  async findOne(id: number): Promise<WorldMapDto | undefined> {
    await this.ensureTable();
    const rows = await this.prismaService.$queryRawUnsafe<WorldMapEntity[]>(
      `
        SELECT
          wm.id,
          wm.book_id AS bookId,
          b.name AS bookName,
          wm.parent_id AS parentId,
          parent.title AS parentTitle,
          wm.title,
          wm.map_type AS mapType,
          COALESCE(wm.description, '') AS description,
          wm.width,
          wm.height,
          wm.sort_order AS sortOrder,
          COALESCE(wm.markers_json, '[]') AS markersJson,
          wm.created_at AS createdAt,
          wm.updated_at AS updatedAt
        FROM world_maps wm
        INNER JOIN books b ON b.id = wm.book_id
        LEFT JOIN world_maps parent ON parent.id = wm.parent_id
        WHERE wm.id = ?
        LIMIT 1
      `,
      id
    );

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  async create(payload: CreateWorldMapDto): Promise<WorldMapDto> {
    await this.ensureTable();
    const insertedId = await this.prismaService.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO world_maps (
            book_id,
            parent_id,
            title,
            map_type,
            description,
            width,
            height,
            sort_order,
            markers_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        payload.bookId,
        payload.parentId ?? null,
        payload.title,
        payload.mapType,
        payload.description ?? "",
        payload.width ?? 1000,
        payload.height ?? 700,
        payload.sortOrder ?? 0,
        JSON.stringify(payload.markers ?? [])
      );

      const inserted = await tx.$queryRawUnsafe<Array<{ id: bigint | number | string }>>(
        "SELECT LAST_INSERT_ID() AS id"
      );

      return this.toNumber(inserted[0]?.id ?? 0);
    });

    return this.findOneOrThrow(insertedId);
  }

  async update(id: number, payload: UpdateWorldMapDto): Promise<WorldMapDto | undefined> {
    await this.ensureTable();
    const existing = await this.findOne(id);

    if (!existing) {
      return undefined;
    }

    await this.prismaService.$executeRawUnsafe(
      `
        UPDATE world_maps
        SET
          book_id = ?,
          parent_id = ?,
          title = ?,
          map_type = ?,
          description = ?,
          width = ?,
          height = ?,
          sort_order = ?,
          markers_json = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      payload.bookId ?? existing.bookId,
      payload.parentId !== undefined ? payload.parentId : existing.parentId,
      payload.title ?? existing.title,
      payload.mapType ?? existing.mapType,
      payload.description ?? existing.description,
      payload.width ?? existing.width,
      payload.height ?? existing.height,
      payload.sortOrder ?? existing.sortOrder,
      JSON.stringify(payload.markers ?? existing.markers),
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

    await this.prismaService.$executeRawUnsafe("DELETE FROM world_maps WHERE id = ?", id);
    return true;
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS world_maps (
        id BIGINT NOT NULL AUTO_INCREMENT,
        book_id BIGINT NOT NULL,
        parent_id BIGINT NULL,
        title VARCHAR(255) NOT NULL,
        map_type VARCHAR(50) NOT NULL DEFAULT 'world',
        description LONGTEXT NULL,
        width INT NOT NULL DEFAULT 1000,
        height INT NOT NULL DEFAULT 700,
        sort_order INT NOT NULL DEFAULT 0,
        markers_json LONGTEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_world_maps_book_id (book_id),
        INDEX idx_world_maps_parent_id (parent_id),
        CONSTRAINT fk_world_maps_book_id FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  private toDto(row: WorldMapEntity): WorldMapDto {
    return {
      id: this.toNumber(row.id),
      bookId: this.toNumber(row.bookId),
      bookName: row.bookName,
      parentId: row.parentId === null ? null : this.toNumber(row.parentId),
      parentTitle: row.parentTitle ?? "",
      title: row.title,
      mapType: row.mapType,
      description: row.description,
      width: row.width,
      height: row.height,
      sortOrder: row.sortOrder,
      markers: this.parseMarkers(row.markersJson),
      createdAt: this.toIsoString(row.createdAt),
      updatedAt: this.toIsoString(row.updatedAt)
    };
  }

  private parseMarkers(value: string): MapMarkerDto[] {
    try {
      const parsed = JSON.parse(value) as MapMarkerDto[];
      return Array.isArray(parsed) ? parsed : [];
    }
    catch {
      return [];
    }
  }

  private async findOneOrThrow(id: number): Promise<WorldMapDto> {
    const map = await this.findOne(id);

    if (!map) {
      throw new Error(`WorldMap ${id} not found after write`);
    }

    return map;
  }

  private toNumber(value: bigint | number | string): number {
    return Number(value);
  }

  private toIsoString(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }

    return parsed.toISOString();
  }
}
