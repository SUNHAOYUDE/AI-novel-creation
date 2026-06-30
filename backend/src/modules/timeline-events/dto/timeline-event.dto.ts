export type TimelineEventDto = {
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
  createdAt: string;
  updatedAt: string;
};
