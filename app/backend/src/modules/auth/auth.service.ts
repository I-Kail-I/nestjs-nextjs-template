import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@/generated/prisma/client';
import { BcryptService } from '@/lib/bcrypt/bcrypt.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResponseDto, LoginSuccessDto } from './dto/response-auth.dto';
import { sessionRedisKey, SESSION_TTL_MS } from './passport-session.strategy';
import { RedisService } from '@/lib/redis/redis.service';

type LoginResult = LoginSuccessDto & { session_token: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly redis: RedisService,
  ) {}

  async findOne(email: string): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
    });

    return user;
  }

  async register(register: RegisterDto): Promise<AuthResponseDto> {
    const hashedPassword = await this.bcrypt.hashPassword(register.password);

    const user = await this.prisma.user.create({
      data: { ...register, password: hashedPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.findOne(loginDto.email);

    const checkPassword = await this.bcrypt.comparePassword(loginDto.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }

    if (user.is_active === false) {
      throw new UnauthorizedException('User is not active');
    }

    const expires_at = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: { user_id: user.id, expires_at },
      select: { id: true },
    });

    const { password, ...result } = user;

    await this.redis.set(sessionRedisKey(session.id), JSON.stringify(result), 'PX', SESSION_TTL_MS);

    return { ...result, session_token: session.id, expires_at };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await Promise.all([
      this.redis.del(sessionRedisKey(token)),
      this.prisma.session.deleteMany({ where: { id: token } }),
    ]);
  }

  async remove(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.is_active) {
      throw new UnauthorizedException('User is already not active');
    }

    const sessions = await this.prisma.session.findMany({
      where: { user_id: userId },
      select: { id: true },
    });

    if (sessions.length > 0) {
      await this.redis.del(...sessions.map((session) => sessionRedisKey(session.id)));
    }

    await this.prisma.session.deleteMany({ where: { user_id: userId } });

    return this.prisma.user.delete({
      where: { id: userId },
      omit: { password: true },
    });
  }
}
