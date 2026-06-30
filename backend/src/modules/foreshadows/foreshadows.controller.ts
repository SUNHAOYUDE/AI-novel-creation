import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateForeshadowDto } from "./dto/create-foreshadow.dto.js";
import type { UpdateForeshadowDto } from "./dto/update-foreshadow.dto.js";
import { ForeshadowsService } from "./foreshadows.service.js";

@Controller("foreshadows")
export class ForeshadowsController {
  constructor(private readonly foreshadowsService: ForeshadowsService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.foreshadowsService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.foreshadowsService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateForeshadowDto) {
    return ok(await this.foreshadowsService.create(payload), "foreshadow created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateForeshadowDto) {
    return ok(await this.foreshadowsService.update(id, payload), "foreshadow updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.foreshadowsService.remove(id), "foreshadow deleted");
  }
}
