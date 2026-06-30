export type CharacterDto = {
  id: number;
  bookId: number;
  bookName: string;
  name: string;
  roleType: string;
  summary: string;
  tags: string[];
  profile: CharacterProfileDto;
  createdAt: string;
  updatedAt: string;
};

export type CharacterProfileDto = {
  gender: string;
  age: string;
  occupation: string;
  faction: string;
  appearance: string;
  personality: string;
  motivation: string;
  goal: string;
  fear: string;
  strength: string;
  weakness: string;
  secret: string;
  arc: string;
};
