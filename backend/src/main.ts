import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 8000);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Unhandled bootstrap error:', error);
  process.exit(1);
});
