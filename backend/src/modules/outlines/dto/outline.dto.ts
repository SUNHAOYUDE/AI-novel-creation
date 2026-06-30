export type OutlineDto = {
  id: number;
  bookId: number;
  level: "global" | "volume" | "chapter";
  title: string;
  summary: string;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
