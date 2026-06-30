import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateBookDto } from "./dto/create-book.dto.js";
import type { UpdateBookDto } from "./dto/update-book.dto.js";
import { BooksService } from "./books.service.js";

@Controller("books")
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get("workbench")
  async workbench(@CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.getWorkbench(user?.id ?? 0));
  }

  @Get()
  async findAll(@CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.findAll(user?.id ?? 0));
  }

  @Get(":id(\\d+)")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.findOne(id, user?.id ?? 0));
  }

  @Post()
  async create(@Body() payload: CreateBookDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.create(payload, user?.id ?? 0), "book created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateBookDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.update(id, payload, user?.id ?? 0), "book updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.booksService.remove(id, user?.id ?? 0), "book deleted");
  }
}
