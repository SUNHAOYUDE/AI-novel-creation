export type MapMarkerDto = {
  id: string;
  title: string;
  markerType: string;
  x: number;
  y: number;
  timeLabel: string;
  description: string;
};

export type WorldMapDto = {
  id: number;
  bookId: number;
  bookName: string;
  parentId: number | null;
  parentTitle: string;
  title: string;
  mapType: string;
  description: string;
  width: number;
  height: number;
  sortOrder: number;
  markers: MapMarkerDto[];
  createdAt: string;
  updatedAt: string;
};
