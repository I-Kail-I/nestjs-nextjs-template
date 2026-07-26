import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email-password')
  async register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('login/email-password')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Delete('delete/:email')
  async remove(@Param('email') email: string) {
    return this.authService.remove(email);
  }
}
