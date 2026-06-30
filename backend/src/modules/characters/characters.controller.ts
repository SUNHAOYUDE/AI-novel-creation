import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateCharacterDto } from "./dto/create-character.dto.js";
import type { UpdateCharacterDto } from "./dto/update-character.dto.js";
import { CharactersService } from "./characters.service.js";

@Controller("characters")
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.charactersService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.charactersService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateCharacterDto) {
    return ok(await this.charactersService.create(payload), "character created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateCharacterDto) {
    return ok(await this.charactersService.update(id, payload), "character updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.charactersService.remove(id), "character deleted");
  }
}
