export type GenerateChapterAiDto = {
  bookId: number;
  chapterId?: number;
  chapterNo?: number;
  title?: string;
  mode: "continue" | "polish" | "rewrite";
  instruction?: string;
  content: string;
};

