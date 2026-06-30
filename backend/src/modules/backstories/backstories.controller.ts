import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateBackstoryDto } from "./dto/create-backstory.dto.js";
import type { GenerateBackstoriesDto } from "./dto/generate-backstories.dto.js";
import type { UpdateBackstoryDto } from "./dto/update-backstory.dto.js";
import { BackstoriesService } from "./backstories.service.js";

@Controller("backstories")
export class BackstoriesController {
  constructor(private readonly backstoriesService: BackstoriesService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateBackstoryDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.create(user?.id ?? 0, payload), "backstory created");
  }

  @Post("generate")
  async generate(@Body() payload: GenerateBackstoriesDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.generate(user?.id ?? 0, payload), "backstories generated");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateBackstoryDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.update(user?.id ?? 0, id, payload), "backstory updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.backstoriesService.remove(user?.id ?? 0, id), "backstory deleted");
  }
}
