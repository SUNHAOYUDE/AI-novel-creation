import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import type { CreateCharacterDto } from "./dto/create-character.dto.js";
import type { CharacterDto, CharacterProfileDto } from "./dto/character.dto.js";
import type { UpdateCharacterDto } from "./dto/update-character.dto.js";

type CharacterEntity = {
  id: bigint;
  bookId: bigint;
  name: string;
  roleType: string;
  summary: string | null;
  personalityProfile: unknown;
  createdAt: Date;
  updatedAt: Date;
  book: {
    name: string;
  };
};

@Injectable()
export class CharactersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(bookId?: number): Promise<CharacterDto[]> {
    const characters = await this.prismaService.character.findMany({
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

    return characters.map((item) => this.toDto(item));
  }

  async findOne(id: number): Promise<CharacterDto | undefined> {
    const character = await this.prismaService.character.findUnique({
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

    return character ? this.toDto(character) : undefined;
  }

  async create(payload: CreateCharacterDto): Promise<CharacterDto> {
    const character = await this.prismaService.character.create({
      data: {
        bookId: BigInt(payload.bookId),
        name: payload.name,
        roleType: payload.roleType,
        summary: payload.summary ?? "",
        personalityProfile: {
          tags: payload.tags ?? [],
          profile: this.normalizeProfile(payload.profile)
        }
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(character);
  }

  async update(id: number, payload: UpdateCharacterDto): Promise<CharacterDto | undefined> {
    const existing = await this.prismaService.character.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return undefined;
    }

    const character = await this.prismaService.character.update({
      where: {
        id: BigInt(id)
      },
      data: {
        bookId: payload.bookId !== undefined ? BigInt(payload.bookId) : undefined,
        name: payload.name,
        roleType: payload.roleType,
        summary: payload.summary,
        personalityProfile: payload.tags || payload.profile
          ? {
            tags: payload.tags ?? this.toTags(existing.personalityProfile),
            profile: this.normalizeProfile(payload.profile ?? this.toProfile(existing.personalityProfile))
          }
          : undefined
      },
      include: {
        book: {
          select: {
            name: true
          }
        }
      }
    });

    return this.toDto(character);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prismaService.character.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existing) {
      return false;
    }

    await this.prismaService.character.delete({
      where: {
        id: BigInt(id)
      }
    });

    return true;
  }

  private toDto(character: CharacterEntity): CharacterDto {
    return {
      id: Number(character.id),
      bookId: Number(character.bookId),
      bookName: character.book.name,
      name: character.name,
      roleType: character.roleType,
      summary: character.summary ?? "",
      tags: this.toTags(character.personalityProfile),
      profile: this.toProfile(character.personalityProfile),
      createdAt: character.createdAt.toISOString(),
      updatedAt: character.updatedAt.toISOString()
    };
  }

  private toTags(profile: unknown): string[] {
    if (!Array.isArray(profile)) {
      if (this.isProfileObject(profile)) {
        const tags = (profile as { tags?: unknown }).tags;
        if (Array.isArray(tags)) {
          return tags
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }
      return [];
    }

    return profile
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toProfile(profile: unknown): CharacterProfileDto {
    if (!this.isProfileObject(profile)) {
      return this.emptyProfile();
    }

    const nested = (profile as { profile?: unknown }).profile;
    return this.normalizeProfile(nested);
  }

  private normalizeProfile(input?: unknown): CharacterProfileDto {
    const base = this.emptyProfile();
    if (!input || typeof input !== "object") {
      return base;
    }

    const record = input as Record<string, unknown>;
    const keys: Array<keyof CharacterProfileDto> = [
      "gender",
      "age",
      "occupation",
      "faction",
      "appearance",
      "personality",
      "motivation",
      "goal",
      "fear",
      "strength",
      "weakness",
      "secret",
      "arc"
    ];

    return keys.reduce((acc, key) => ({
      ...acc,
      [key]: typeof record[key] === "string" ? String(record[key]) : acc[key]
    }), base);
  }

  private emptyProfile(): CharacterProfileDto {
    return {
      gender: "",
      age: "",
      occupation: "",
      faction: "",
      appearance: "",
      personality: "",
      motivation: "",
      goal: "",
      fear: "",
      strength: "",
      weakness: "",
      secret: "",
      arc: ""
    };
  }

  private isProfileObject(value: unknown) {
    if (!value || typeof value !== "object") {
      return false;
    }

    return !Array.isArray(value);
  }
}
