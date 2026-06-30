export type CreateOutlineDto = {
  bookId: number;
  level: "global" | "volume" | "chapter";
  title: string;
  summary?: string;
  status?: string;
  sortOrder?: number;
};
