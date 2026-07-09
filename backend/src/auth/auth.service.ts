import type { User } from '@/generated/prisma/client';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';

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

  async register(createAuthDto: CreateAuthDto): Promise<Omit<User, 'password'>> {
    const SALT_ROUNDS = 12;

    const hashPassword = await bcrypt.hash(createAuthDto.password, SALT_ROUNDS);

    const checkEmail = await this.prisma.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (checkEmail) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.prisma.user.create({
      data: { ...createAuthDto, password: hashPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(loginDto.email);

    const checkPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const { password, ...result } = user;

    return result;
  }

  async remove(email: string): Promise<User> {
    await this.findOne(email);

    return this.prisma.user.delete({ where: { email } });
  }
}
