import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DbService } from './db/db.service';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [DbService],
  exports: [DbService],
})
export class AppModule {}
