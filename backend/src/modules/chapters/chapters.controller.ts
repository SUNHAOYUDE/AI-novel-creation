import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateChapterDto } from "./dto/create-chapter.dto.js";
import type { GenerateChapterAiDto } from "./dto/generate-chapter-ai.dto.js";
import type { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { ChaptersService } from "./chapters.service.js";

@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateChapterDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.create(user?.id ?? 0, payload), "chapter created");
  }

  @Post("ai")
  async generateAi(@Body() payload: GenerateChapterAiDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.generateAi(user?.id ?? 0, payload));
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateChapterDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.update(user?.id ?? 0, id, payload), "chapter updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.chaptersService.remove(user?.id ?? 0, id), "chapter deleted");
  }
}
