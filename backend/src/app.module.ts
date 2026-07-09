import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { MorganMiddleware } from './common/middleware/morgan.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { isProduction } from './utils/check-env';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss',
              },
            },
        autoLogging: false,
      },
    }),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}
