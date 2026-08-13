import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User } from '@/generated/prisma/client';
import { comparePassword, hashPassword } from '@/lib/bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResponseDto, LoginSuccessDto } from './dto/response-auth.dto';
import { SESSION_TTL_MS } from './passport-session.strategy';

type LoginResult = LoginSuccessDto & { session_token: string };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email is not registered');
    }

    return user;
  }

  async register(register: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: register.email },
      select: { id: true },
    });

    if (existing) throw new ConflictException('Email is already registered');

    const hashedPassword = await hashPassword(register.password);

    const user = await this.prisma.user.create({
      data: { ...register, password: hashedPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.findOne(loginDto.email);

    const checkPassword = await comparePassword(loginDto.password, user.password);

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

    return { ...result, session_token: session.id, expires_at };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.prisma.session.deleteMany({ where: { id: token } });
  }

  async remove(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.is_active) {
      throw new UnauthorizedException('User is already not active');
    }

    await this.prisma.session.deleteMany({ where: { user_id: userId } });

    return this.prisma.user.delete({
      where: { id: userId },
      omit: { password: true },
    });
  }
}
