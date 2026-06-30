import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateBackstoryDto } from "./dto/create-backstory.dto.js";
import type { GenerateBackstoriesDto } from "./dto/generate-backstories.dto.js";
import type { UpdateBackstoryDto } from "./dto/update-backstory.dto.js";
import { BackstoriesService } from "./backstories.service.js";

@Controller("backstories")
export class BackstoriesController {
  constructor(private readonly backstoriesService: BackstoriesService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.backstoriesService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.backstoriesService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateBackstoryDto) {
    return ok(await this.backstoriesService.create(payload), "backstory created");
  }

  @Post("generate")
  async generate(@Body() payload: GenerateBackstoriesDto) {
    return ok(await this.backstoriesService.generate(payload), "backstories generated");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateBackstoryDto) {
    return ok(await this.backstoriesService.update(id, payload), "backstory updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.backstoriesService.remove(id), "backstory deleted");
  }
}
