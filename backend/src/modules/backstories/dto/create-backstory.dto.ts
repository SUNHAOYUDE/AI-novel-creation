export type CreateBackstoryDto = {
  bookId: number;
  kind?: string;
  source?: string;
  title: string;
  content?: string;
  sortOrder?: number;
};
