export type CreateEconomyEntryDto = {
  bookId: number;
  category: string;
  title: string;
  region?: string;
  circulation?: string;
  coreValue?: string;
  description?: string;
  risk?: string;
  sortOrder?: number;
};
