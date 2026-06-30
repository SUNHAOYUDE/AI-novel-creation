import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma.service.js";
import type { AuthUser, JwtPayload } from "./auth.types.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";
import { UsersRepository } from "./users.repository.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async register(payload: RegisterDto) {
    const email = this.normalizeEmail(payload.email);
    if (!email || !email.includes("@")) {
      throw new BadRequestException("Email is invalid.");
    }

    if (!payload.password || payload.password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters.");
    }

    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email already registered.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.usersRepository.createUser({ email, passwordHash, role: "user" });

    return {
      user: this.toAuthUser(user),
      token: await this.signToken(this.toAuthUser(user))
    };
  }

  async login(payload: LoginDto) {
    const email = this.normalizeEmail(payload.email);
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const ok = await bcrypt.compare(payload.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const authUser = this.toAuthUser(user);
    return {
      user: authUser,
      token: await this.signToken(authUser)
    };
  }

  async me(user: AuthUser) {
    const existing = await this.usersRepository.findById(user.id);
    if (!existing) {
      throw new UnauthorizedException("User not found.");
    }

    return this.toAuthUser(existing);
  }

  async ensureAdminSeed() {
    const count = await this.usersRepository.countUsers();
    if (count > 0) {
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!adminEmail || !adminPassword) {
      return;
    }

    const email = this.normalizeEmail(adminEmail);
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await this.usersRepository.createUser({ email, passwordHash, role: "admin" });

    await this.prismaService.book.updateMany({
      where: {
        ownerId: null
      },
      data: {
        ownerId: admin.id
      }
    });
  }

  private async signToken(user: AuthUser) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me"
    });
  }

  private toAuthUser(user: { id: bigint; email: string; role: string }): AuthUser {
    return {
      id: Number(user.id),
      email: user.email,
      role: user.role
    };
  }
}

