import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { CreateCharacterDto } from "./dto/create-character.dto.js";
import type { CharacterDto } from "./dto/character.dto.js";
import type { UpdateCharacterDto } from "./dto/update-character.dto.js";
import { CharactersRepository } from "./characters.repository.js";

@Injectable()
export class CharactersService {
  constructor(
    private readonly charactersRepository: CharactersRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  findAll(bookId?: number): Promise<CharacterDto[]> {
    return this.charactersRepository.findAll(bookId);
  }

  async findOne(id: number): Promise<CharacterDto> {
    const character = await this.charactersRepository.findOne(id);

    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    return character;
  }

  async create(payload: CreateCharacterDto): Promise<CharacterDto> {
    const created = await this.charactersRepository.create(payload);
    await this.writeAudit(created.bookId, String(created.id), "create", `新增角色：${created.name}`, created);
    return created;
  }

  async update(id: number, payload: UpdateCharacterDto): Promise<CharacterDto> {
    const character = await this.charactersRepository.update(id, payload);

    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    await this.writeAudit(character.bookId, String(character.id), "update", `更新角色：${character.name}`, character);
    return character;
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.charactersRepository.findOne(id);
    const removed = await this.charactersRepository.remove(id);

    if (!removed) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    if (existing) {
      await this.writeAudit(existing.bookId, String(existing.id), "delete", `删除角色：${existing.name}`, existing);
    }
    return { success: true };
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
