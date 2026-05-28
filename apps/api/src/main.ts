import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter.js";
import { ApiResponseInterceptor } from "./common/interceptors/api-response.interceptor.js";
import { getApiEnv } from "./config/env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = getApiEnv();

  app.enableCors({
    origin: env.corsOrigins,
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
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
