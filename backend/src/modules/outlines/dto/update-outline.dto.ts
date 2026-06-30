import type { CreateOutlineDto } from "./create-outline.dto.js";

export type UpdateOutlineDto = Partial<Omit<CreateOutlineDto, "bookId">>;
