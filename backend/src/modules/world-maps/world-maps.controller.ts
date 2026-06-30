import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateWorldMapDto } from "./dto/create-world-map.dto.js";
import type { UpdateWorldMapDto } from "./dto/update-world-map.dto.js";
import { WorldMapsService } from "./world-maps.service.js";

@Controller("world-maps")
export class WorldMapsController {
  constructor(private readonly worldMapsService: WorldMapsService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.worldMapsService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.worldMapsService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateWorldMapDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.worldMapsService.create(user?.id ?? 0, payload), "world map created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateWorldMapDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.worldMapsService.update(user?.id ?? 0, id, payload), "world map updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.worldMapsService.remove(user?.id ?? 0, id), "world map deleted");
  }
}
