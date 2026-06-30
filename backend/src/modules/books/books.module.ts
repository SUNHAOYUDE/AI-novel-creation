import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { BooksController } from "./books.controller.js";
import { BooksRepository } from "./books.repository.js";
import { BooksService } from "./books.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [BooksController],
  providers: [PrismaService, BooksRepository, BooksService]
})
export class BooksModule {}
