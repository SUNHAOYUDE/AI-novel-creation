import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateCharacterDto } from "./dto/create-character.dto.js";
import type { UpdateCharacterDto } from "./dto/update-character.dto.js";
import { CharactersService } from "./characters.service.js";

@Controller("characters")
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.charactersService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.charactersService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateCharacterDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.charactersService.create(user?.id ?? 0, payload), "character created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateCharacterDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.charactersService.update(user?.id ?? 0, id, payload), "character updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.charactersService.remove(user?.id ?? 0, id), "character deleted");
  }
}
