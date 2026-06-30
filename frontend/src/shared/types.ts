import type { LucideIcon } from "lucide-react";

export type NavItem = {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: FeatureStatus;
};

export type FeatureStatus = "implemented" | "in_progress" | "planned";

export type StatItem = {
  label: string;
  value: string;
  hint: string;
};

export type Book = {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  status: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BookPayload = {
  name: string;
  category: string;
  subCategory: string;
  status: string;
  description: string;
};

export type BookWorkspaceCounts = {
  backstories: number;
  maps: number;
  timeline: number;
  economy: number;
  outlines: number;
  characters: number;
  foreshadows: number;
  chapters: number;
};

export type WorkbenchBook = {
  book: Book;
  counts: BookWorkspaceCounts;
  latestChapter: Chapter | null;
};

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type AuditLog = {
  id: number;
  bookId: number | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  payloadJson: string;
  createdAt: string;
};

export type SystemSettings = {
  deepSeek: {
    configured: boolean;
    apiKeyMasked: string;
    baseUrl: string;
    model: string;
  };
  ai: {
    requestTimeoutMs: number;
  };
};

export type UpdateSystemSettingsPayload = {
  deepSeekApiKey?: string;
  deepSeekBaseUrl?: string;
  deepSeekModel?: string;
  aiRequestTimeoutMs?: number;
};

export type BackstoryKind = "history" | "rule" | "culture" | "faction" | "secret";
export type EntrySource = "manual" | "ai";

export type Outline = {
  id: number;
  bookId: number;
  level: "global" | "volume" | "chapter";
  title: string;
  summary: string;
  status: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type GenerateOutlinePayload = {
  bookId: number;
  premise: string;
  targetTone: string;
  specialHook: string;
  requirements: string;
};

export type OutlinePayload = {
  bookId: number;
  level: "global" | "volume" | "chapter";
  title: string;
  summary: string;
  status: string;
  sortOrder: number;
};

export type Character = {
  id: number;
  bookId: number;
  bookName: string;
  name: string;
  roleType: string;
  summary: string;
  createdAt?: string;
  updatedAt?: string;
  tags: string[];
  profile: CharacterProfile;
};

export type CharacterProfile = {
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

export type CharacterPayload = {
  bookId: number;
  name: string;
  roleType: string;
  summary: string;
  tags: string[];
  profile: CharacterProfile;
};

export type Foreshadow = {
  id: number;
  bookId: number;
  bookName: string;
  title: string;
  surfaceInfo: string;
  realIntent: string;
  targetPayoff: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ForeshadowPayload = {
  bookId: number;
  title: string;
  surfaceInfo: string;
  realIntent: string;
  targetPayoff: string;
  status: string;
};

export type Chapter = {
  id: number;
  bookId: number;
  bookName: string;
  chapterNo: number;
  title: string;
  content: string;
  status: string;
  wordCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ChapterPayload = {
  bookId: number;
  chapterNo: number;
  title: string;
  content: string;
  status: string;
};

export type ChapterAiMode = "continue" | "polish" | "rewrite";

export type GenerateChapterAiPayload = {
  bookId: number;
  chapterId?: number;
  chapterNo?: number;
  title?: string;
  mode: ChapterAiMode;
  instruction?: string;
  content: string;
};

export type GenerateChapterAiResult = {
  text: string;
};

export type Backstory = {
  id: number;
  bookId: number;
  bookName: string;
  kind: BackstoryKind;
  source: EntrySource;
  title: string;
  content: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BackstoryPayload = {
  bookId: number;
  kind: BackstoryKind;
  title: string;
  content: string;
  sortOrder: number;
};

export type GenerateBackstoryPayload = {
  bookId: number;
  prompt: string;
  focus: string;
  count: number;
};

export type MapMarkerType = "place" | "event";

export type MapMarker = {
  id: string;
  title: string;
  markerType: MapMarkerType;
  x: number;
  y: number;
  timeLabel: string;
  description: string;
};

export type WorldMapType = "world" | "region" | "local";

export type WorldMap = {
  id: number;
  bookId: number;
  bookName: string;
  parentId: number | null;
  parentTitle: string;
  title: string;
  mapType: WorldMapType;
  description: string;
  width: number;
  height: number;
  sortOrder: number;
  markers: MapMarker[];
  createdAt?: string;
  updatedAt?: string;
};

export type WorldMapPayload = {
  bookId: number;
  parentId: number | null;
  title: string;
  mapType: WorldMapType;
  description: string;
  width: number;
  height: number;
  sortOrder: number;
  markers: MapMarker[];
};

export type TimelineEvent = {
  id: number;
  bookId: number;
  bookName: string;
  relatedMapId: number | null;
  relatedMapTitle: string;
  era: string;
  timeLabel: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TimelineEventPayload = {
  bookId: number;
  relatedMapId: number | null;
  era: string;
  timeLabel: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type EconomyCategory = "currency" | "resource" | "industry" | "trade" | "finance";

export type EconomyEntry = {
  id: number;
  bookId: number;
  bookName: string;
  category: EconomyCategory;
  title: string;
  region: string;
  circulation: string;
  coreValue: string;
  description: string;
  risk: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type EconomyEntryPayload = {
  bookId: number;
  category: EconomyCategory;
  title: string;
  region: string;
  circulation: string;
  coreValue: string;
  description: string;
  risk: string;
  sortOrder: number;
};
