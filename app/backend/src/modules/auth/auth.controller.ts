import type { Response } from 'express';
import { Body, Controller, Delete, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResponseDto, LoginSuccessDto } from './dto/response-auth.dto';
import { PassportSessionGuard } from './passport-session.guard';
import * as passportSessionStrategy from './passport-session.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOkResponse({ type: AuthResponseDto })
  @Post('register/email-password')
  async register(@Body() createAuthDto: RegisterDto) {
    return this.authService.register(createAuthDto);
  }

  @ApiOkResponse({ type: LoginSuccessDto })
  @Post('login/email-password')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    const { session_token, ...publicResult } = result;
    res.cookie(passportSessionStrategy.SESSION_COOKIE, session_token, {
      ...passportSessionStrategy.sessionCookieOptions,
      maxAge: result.expires_at.getTime() - Date.now(),
    });
    return publicResult;
  }

  @ApiOkResponse({ type: AuthResponseDto })
  @UseGuards(PassportSessionGuard)
  @Get('me')
  me(@Req() req: passportSessionStrategy.AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(PassportSessionGuard)
  @Post('logout')
  async logout(
    @Req() req: passportSessionStrategy.AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.cookies?.[passportSessionStrategy.SESSION_COOKIE]);
    res.clearCookie(
      passportSessionStrategy.SESSION_COOKIE,
      passportSessionStrategy.sessionCookieOptions,
    );
    return { message: 'Logged out successfully' };
  }

  @ApiOkResponse({ type: AuthResponseDto })
  @UseGuards(PassportSessionGuard)
  @Delete('delete-account')
  async remove(
    @Req() req: passportSessionStrategy.AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.remove(req.user.id);
    res.clearCookie(
      passportSessionStrategy.SESSION_COOKIE,
      passportSessionStrategy.sessionCookieOptions,
    );
    return result;
  }
}
