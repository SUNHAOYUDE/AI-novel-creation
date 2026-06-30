import type { CharacterProfileDto } from "./character.dto.js";

export type CreateCharacterDto = {
  bookId: number;
  name: string;
  roleType: string;
  summary?: string;
  tags?: string[];
  profile?: CharacterProfileDto;
};
