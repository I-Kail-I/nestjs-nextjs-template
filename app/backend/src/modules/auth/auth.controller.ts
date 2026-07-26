import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';
import { AuthResponseDto } from './dto/response-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOkResponse({ type: AuthResponseDto })
  @Post('register/email-password')
  async register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @ApiOkResponse({ type: AuthResponseDto })
  @Post('login/email-password')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOkResponse({ type: AuthResponseDto })
  @Delete('delete/:email')
  async remove(@Param('email') email: string) {
    return this.authService.remove(email);
  }
}
