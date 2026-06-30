export type CreateChapterDto = {
  bookId: number;
  chapterNo: number;
  title: string;
  content?: string;
  status?: string;
};
