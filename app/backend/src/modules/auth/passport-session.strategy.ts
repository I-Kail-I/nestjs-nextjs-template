import type { User } from '@/generated/prisma/client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import passport from 'passport';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { RedisService } from '@/lib/redis/redis.service';
import { isProduction } from '@/utils/check-env';

export type SafeUser = Omit<User, 'password'>;
export interface AuthenticatedRequest extends Express.Request {
  cookies: Record<string, string | undefined>;
  user: SafeUser;
}
export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_REDIS_PREFIX = 'session:';
export const sessionRedisKey = (token: string): string => `${SESSION_REDIS_PREFIX}${token}`;
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
};

@Injectable()
export class PassportSessionStrategy extends PassportStrategy(passport.Strategy, 'db-session') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
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

    if (token == null) {
      this.fail(new UnauthorizedException('Not authenticated'), 401);
      return;
    }

    void this.getSessionUser(token)
      .then((user) => {
        if (user == null || !user.is_active) {
          return this.fail(new UnauthorizedException('Invalid session'), 401);
        }
        this.success(user);
      })
      .catch((error: unknown) => this.error(error as Error));
  }

  private async getSessionUser(token: string): Promise<SafeUser | null> {
    try {
      const cached = await this.redis.get(sessionRedisKey(token));
      if (cached) {
        return JSON.parse(cached) as SafeUser;
      }
    } catch {
      // Redis unavailable: fall back to the database
    }

    const session = await this.prisma.session.findUnique({
      where: { id: token },
      include: { user: true },
    });

    if (session == null) return null;

    if (session.expires_at.getTime() < Date.now()) {
      await this.prisma.session.deleteMany({ where: { id: session.id } });
      await this.redis.del(sessionRedisKey(token)).catch(() => undefined);
      return null;
    }

    const { password: _password, ...user } = session.user;

    await this.redis
      .set(
        sessionRedisKey(token),
        JSON.stringify(user),
        'PX',
        session.expires_at.getTime() - Date.now(),
      )
      .catch(() => undefined);

    return user;
  }
}
