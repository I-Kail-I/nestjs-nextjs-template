import type { User } from '@/generated/prisma/client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import passport from 'passport';
import { PrismaService } from '@/common/prisma/prisma.service';
import { isProduction } from '@/utils/check-env';

export type SafeUser = Omit<User, 'password'>;
export interface AuthenticatedRequest extends Express.Request {
  cookies: Record<string, string | undefined>;
  user: SafeUser;
}
export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
};

@Injectable()
export class PassportSessionStrategy extends PassportStrategy(passport.Strategy, 'db-session') {
  constructor(private readonly prisma: PrismaService) {
    super();
    this.name = 'db-session';
  }

  validate(user: SafeUser): SafeUser {
    return user;
  }

  authenticate(req: Express.Request): void {
    const request = req as Express.Request & {
      cookies?: Record<string, string | undefined>;
    };
    const token = request.cookies?.[SESSION_COOKIE];

    if (token == null) return this.fail(new UnauthorizedException('Not authenticated'), 401);

    void this.prisma.session
      .findUnique({
        where: { id: token },
        include: { user: true },
      })
      .then(async (session) => {
        if (!session || !session.user.is_active) {
          return this.fail(new UnauthorizedException('Invalid session'), 401);
        }
        if (session.expires_at.getTime() < Date.now()) {
          await this.prisma.session.deleteMany({ where: { id: session.id } });
          return this.fail(new UnauthorizedException('Session expired'), 401);
        }

        const { password: _password, ...user } = session.user;
        this.success(user);
      })
      .catch((error: unknown) => this.error(error as Error));
  }
}
