import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { AuthService } from "./modules/auth/auth.service.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix("api");

  const authService = app.get(AuthService);
  await authService.ensureAdminSeed();

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
