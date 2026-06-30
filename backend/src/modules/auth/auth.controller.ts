import { Body, Controller, Get, Post } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "./current-user.decorator.js";
import type { AuthUser } from "./auth.types.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";
import { Public } from "./public.decorator.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  async register(@Body() payload: RegisterDto) {
    const data = await this.authService.register(payload);
    return ok(data);
  }

  @Public()
  @Post("login")
  async login(@Body() payload: LoginDto) {
    const data = await this.authService.login(payload);
    return ok(data);
  }

  @Get("me")
  async me(@CurrentUser() user?: AuthUser) {
    if (!user) {
      return ok(null);
    }

    return ok(await this.authService.me(user));
  }
}

