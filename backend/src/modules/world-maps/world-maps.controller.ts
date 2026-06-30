import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateWorldMapDto } from "./dto/create-world-map.dto.js";
import type { UpdateWorldMapDto } from "./dto/update-world-map.dto.js";
import { WorldMapsService } from "./world-maps.service.js";

@Controller("world-maps")
export class WorldMapsController {
  constructor(private readonly worldMapsService: WorldMapsService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.worldMapsService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.worldMapsService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateWorldMapDto) {
    return ok(await this.worldMapsService.create(payload), "world map created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateWorldMapDto) {
    return ok(await this.worldMapsService.update(id, payload), "world map updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.worldMapsService.remove(id), "world map deleted");
  }
}
