import { Module } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { createAuth } from './auth.config';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      isGlobal: true,
      inject: [DbService],
      useFactory: (db: DbService) => ({
        auth: createAuth(db),
      }),
    }),
  ],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
