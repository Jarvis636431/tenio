import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { getApiEnv } from "./config/env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = getApiEnv();

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(env.port);
  console.log(`API listening on http://localhost:${env.port}`);
}

void bootstrap();
