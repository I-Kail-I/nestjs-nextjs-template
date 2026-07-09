/* eslint-disable perfectionist/sort-imports */
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const PORT: number = Number(process.env.PORT ?? 8000);

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use(helmet());

  await app.listen(PORT);
  console.log(`Server is running on port ${PORT}`);
}
void bootstrap();
