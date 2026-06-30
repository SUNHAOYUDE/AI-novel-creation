import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateOutlineDto } from "./dto/create-outline.dto.js";
import type { GenerateOutlineDto } from "./dto/generate-outline.dto.js";
import type { UpdateOutlineDto } from "./dto/update-outline.dto.js";
import { OutlinesService } from "./outlines.service.js";

@Controller("outlines")
export class OutlinesController {
  constructor(private readonly outlinesService: OutlinesService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateOutlineDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.create(user?.id ?? 0, payload), "outline created");
  }

  @Post("generate")
  async generate(@Body() payload: GenerateOutlineDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.generate(user?.id ?? 0, payload), "outlines generated");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateOutlineDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.update(user?.id ?? 0, id, payload), "outline updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.outlinesService.remove(user?.id ?? 0, id), "outline deleted");
  }
}
