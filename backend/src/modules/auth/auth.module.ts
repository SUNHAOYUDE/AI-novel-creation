import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { UsersRepository } from "./users.repository.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: {
        expiresIn: "30d"
      }
    })
  ],
  controllers: [AuthController],
  providers: [PrismaService, UsersRepository, AuthService],
  exports: [JwtModule]
})
export class AuthModule {}

