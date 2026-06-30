import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateCharacterDto } from "./dto/create-character.dto.js";
import type { CharacterDto } from "./dto/character.dto.js";
import type { UpdateCharacterDto } from "./dto/update-character.dto.js";
import { CharactersRepository } from "./characters.repository.js";

@Injectable()
export class CharactersService {
  constructor(
    private readonly charactersRepository: CharactersRepository,
    private readonly prismaService: PrismaService,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async findAll(userId: number, bookId?: number): Promise<CharacterDto[]> {
    this.requireUserId(userId);
    if (bookId !== undefined) {
      await this.ensureBookOwned(bookId, userId);
    }
    return this.charactersRepository.findAll(bookId);
  }

  async findOne(userId: number, id: number): Promise<CharacterDto> {
    this.requireUserId(userId);
    const character = await this.charactersRepository.findOne(id);

    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    await this.ensureBookOwned(character.bookId, userId);
    return character;
  }

  async create(userId: number, payload: CreateCharacterDto): Promise<CharacterDto> {
    this.requireUserId(userId);
    await this.ensureBookOwned(payload.bookId, userId);
    const created = await this.charactersRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增角色：${created.name}`, created);
    return created;
  }

  async update(userId: number, id: number, payload: UpdateCharacterDto): Promise<CharacterDto> {
    this.requireUserId(userId);
    const existing = await this.charactersRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Character ${id} not found`);
    }
    await this.ensureBookOwned(existing.bookId, userId);
    const character = await this.charactersRepository.update(id, payload);

    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    await this.writeAudit(character.bookId, String(character.id), "update", `更新角色：${character.name}`, character);
    return character;
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    this.requireUserId(userId);
    const existing = await this.charactersRepository.findOne(id);
    if (existing) {
      await this.ensureBookOwned(existing.bookId, userId);
    }
    const removed = await this.charactersRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除角色：${existing.name}`, existing);
    }
    return { success: true };
  }

  private async ensureBookOwned(bookId: number, userId: number) {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      throw new BadRequestException("bookId is invalid.");
    }

    const book = await this.prismaService.book.findFirst({
      where: {
        id: BigInt(bookId),
        ownerId: BigInt(userId)
      }
    });

    if (!book) {
      throw new NotFoundException(`Book ${bookId} not found`);
    }
  }

  private requireUserId(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new UnauthorizedException("Unauthorized");
    }
  }

  private async writeAudit(bookId: number, entityId: string, action: string, summary: string, payload: unknown) {
    await this.auditLogsRepository.create({
      bookId,
      entityType: "character",
      entityId,
      action,
      summary,
      payloadJson: JSON.stringify(payload)
    });
  }
}
