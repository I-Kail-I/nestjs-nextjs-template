import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportSessionGuard } from './passport-session.guard';
import { PassportSessionStrategy } from './passport-session.strategy';

@Module({
  controllers: [AuthController],
  imports: [PassportModule.register({ session: false })],
  providers: [AuthService, PassportSessionStrategy, PassportSessionGuard, RolesGuard],
})
export class AuthModule {}
