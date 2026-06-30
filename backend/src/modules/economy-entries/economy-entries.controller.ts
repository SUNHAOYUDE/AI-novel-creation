import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateEconomyEntryDto } from "./dto/create-economy-entry.dto.js";
import type { UpdateEconomyEntryDto } from "./dto/update-economy-entry.dto.js";
import { EconomyEntriesService } from "./economy-entries.service.js";

@Controller("economy-entries")
export class EconomyEntriesController {
  constructor(private readonly economyEntriesService: EconomyEntriesService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.economyEntriesService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.economyEntriesService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateEconomyEntryDto) {
    return ok(await this.economyEntriesService.create(payload), "economy entry created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateEconomyEntryDto) {
    return ok(await this.economyEntriesService.update(id, payload), "economy entry updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.economyEntriesService.remove(id), "economy entry deleted");
  }
}
