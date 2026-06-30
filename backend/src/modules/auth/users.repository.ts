import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async countUsers(): Promise<number> {
    return this.prismaService.user.count();
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email
      }
    });
  }

  async findById(id: number) {
    return this.prismaService.user.findUnique({
      where: {
        id: BigInt(id)
      }
    });
  }

  async createUser(payload: { email: string; passwordHash: string; role?: string }) {
    return this.prismaService.user.create({
      data: {
        email: payload.email,
        passwordHash: payload.passwordHash,
        role: payload.role ?? "user"
      }
    });
  }
}

