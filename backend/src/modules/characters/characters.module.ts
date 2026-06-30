import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";
import { AuditLogsModule } from "../audit-logs/audit-logs.module.js";
import { CharactersController } from "./characters.controller.js";
import { CharactersRepository } from "./characters.repository.js";
import { CharactersService } from "./characters.service.js";

@Module({
  imports: [AuditLogsModule],
  controllers: [CharactersController],
  providers: [PrismaService, CharactersRepository, CharactersService]
})
export class CharactersModule {}
