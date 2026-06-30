import type { MapMarkerDto } from "./world-map.dto.js";

export type CreateWorldMapDto = {
  bookId: number;
  parentId?: number | null;
  title: string;
  mapType: string;
  description?: string;
  width?: number;
  height?: number;
  sortOrder?: number;
  markers?: MapMarkerDto[];
};
