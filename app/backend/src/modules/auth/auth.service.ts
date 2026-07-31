import type { AuthResponse, Login, Register, User } from '@template/schema';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { comparePassword, hashPassword } from '@/lib/bcrypt';

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

  async register(data: Register): Promise<AuthResponse> {
    const hashedPassword = await hashPassword(data.password);

    const checkEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (checkEmail) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.prisma.user.create({
      data: { ...data, password: hashedPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(data: Login): Promise<AuthResponse> {
    const user = await this.findOne(data.email);

    const checkPassword = await comparePassword(data.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const { password, ...result } = user;

    return result;
  }

  async remove(email: string): Promise<AuthResponse> {
    await this.findOne(email);

    return this.prisma.user.delete({ where: { email } });
  }
}
