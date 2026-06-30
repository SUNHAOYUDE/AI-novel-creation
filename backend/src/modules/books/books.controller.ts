import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateBookDto } from "./dto/create-book.dto.js";
import type { UpdateBookDto } from "./dto/update-book.dto.js";
import { BooksService } from "./books.service.js";

@Controller("books")
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get("workbench")
  async workbench() {
    return ok(await this.booksService.getWorkbench());
  }

  @Get()
  async findAll() {
    return ok(await this.booksService.findAll());
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.booksService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateBookDto) {
    return ok(await this.booksService.create(payload), "book created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateBookDto) {
    return ok(await this.booksService.update(id, payload), "book updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.booksService.remove(id), "book deleted");
  }
}
