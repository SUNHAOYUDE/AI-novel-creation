import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateOutlineDto } from "./dto/create-outline.dto.js";
import type { GenerateOutlineDto } from "./dto/generate-outline.dto.js";
import type { UpdateOutlineDto } from "./dto/update-outline.dto.js";
import { OutlinesService } from "./outlines.service.js";

@Controller("outlines")
export class OutlinesController {
  constructor(private readonly outlinesService: OutlinesService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.outlinesService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.outlinesService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateOutlineDto) {
    return ok(await this.outlinesService.create(payload), "outline created");
  }

  @Post("generate")
  async generate(@Body() payload: GenerateOutlineDto) {
    return ok(await this.outlinesService.generate(payload), "outlines generated");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateOutlineDto) {
    return ok(await this.outlinesService.update(id, payload), "outline updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.outlinesService.remove(id), "outline deleted");
  }
}
