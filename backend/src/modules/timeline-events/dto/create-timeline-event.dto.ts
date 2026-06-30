export type CreateTimelineEventDto = {
  bookId: number;
  relatedMapId?: number | null;
  era?: string;
  timeLabel: string;
  title: string;
  description?: string;
  sortOrder?: number;
};
