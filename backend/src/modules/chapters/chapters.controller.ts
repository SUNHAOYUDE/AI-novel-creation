import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateChapterDto } from "./dto/create-chapter.dto.js";
import type { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { ChaptersService } from "./chapters.service.js";

@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.chaptersService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.chaptersService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateChapterDto) {
    return ok(await this.chaptersService.create(payload), "chapter created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateChapterDto) {
    return ok(await this.chaptersService.update(id, payload), "chapter updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.chaptersService.remove(id), "chapter deleted");
  }
}
