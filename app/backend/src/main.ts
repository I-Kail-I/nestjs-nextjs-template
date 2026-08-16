/* eslint-disable perfectionist/sort-imports */
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { isDevelopment } from './utils/check-env';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const PORT: number = Number(process.env.PORT ?? 8000);

  // Enable and app using helper
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * ! SOME NOTE FOR THIS!
   * So I create this CORS incase you want to seperate
   * your backend and frontend as seprate domain
   * but by default I use the proxy in the nextjs and for prod
   * I use Caddy, so technically you dont need this. And if you
   * want to use this, you can uncomment this, or delete it if
   * you dont want to use it.
   */

  // app.enableCors({
  //   origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: 'Content-Type, Accept, Authorization',
  //   credentials: true,
  // });

  // The backend will start as "/api" at the url
  // So if you want to access the backend, you need to use "/api" as prefix
  app.setGlobalPrefix('api');

  // Middlewares
  app.use(helmet());
  app.use(cookieParser());

  // This is for the swagger docs, it by default is only available in development
  if (isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle('My API')
      .setDescription('API description')
      .setVersion('1.0')
      .addCookieAuth('session')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(PORT);
  console.log(`Server is running on port ${PORT}`);
}
void bootstrap();
