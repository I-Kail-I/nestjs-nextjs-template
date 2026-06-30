import { Module } from '@nestjs/common';
import { DbModule } from '@/db/db.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
