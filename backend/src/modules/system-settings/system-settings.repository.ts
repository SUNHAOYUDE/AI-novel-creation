import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class SystemSettingsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async get(key: string): Promise<string | undefined> {
    await this.ensureTable();
    const rows = await this.prismaService.$queryRawUnsafe<Array<{ value: string | null }>>(
      "SELECT value FROM system_settings WHERE `key` = ? LIMIT 1",
      key
    );
    const value = rows[0]?.value ?? null;
    return value === null ? undefined : value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureTable();
    await this.prismaService.$executeRawUnsafe(
      `
        INSERT INTO system_settings (\`key\`, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP(3)
      `,
      key,
      value
    );
  }

  async getInt(key: string): Promise<number | undefined> {
    const value = await this.get(key);
    if (value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  async setInt(key: string, value: number): Promise<void> {
    await this.set(key, String(value));
  }

  private async ensureTable() {
    await this.prismaService.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(100) NOT NULL,
        value LONGTEXT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}
