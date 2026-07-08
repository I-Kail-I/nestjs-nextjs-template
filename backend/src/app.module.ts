import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  providers: [],
  imports: [PrismaModule, AuthModule],
})
export class AppModule {}
