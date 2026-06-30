export const domainEvents = {
  bookCreated: "BookCreated",
  bookUpdated: "BookUpdated",
  characterCreated: "CharacterCreated",
  characterUpdated: "CharacterUpdated",
  outlineCreated: "OutlineCreated",
  chapterCreated: "ChapterCreated",
  foreshadowCreated: "ForeshadowCreated"
} as const;

export type DomainEventName = (typeof domainEvents)[keyof typeof domainEvents];
