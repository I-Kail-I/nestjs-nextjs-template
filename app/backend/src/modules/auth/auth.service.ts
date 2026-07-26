import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User } from '@/generated/prisma/client';
import { comparePassword, hashPassword } from '@/lib/bcrypt';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';
import { AuthResponseDto } from './dto/response-auth.dto';

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

  async register(createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
    const hashedPassword = await hashPassword(createAuthDto.password);

    const checkEmail = await this.prisma.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (checkEmail) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.prisma.user.create({
      data: { ...createAuthDto, password: hashedPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findOne(loginDto.email);

    const checkPassword = await comparePassword(loginDto.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const { password, ...result } = user;

    return result;
  }

  async remove(email: string): Promise<AuthResponseDto> {
    await this.findOne(email);

    return this.prisma.user.delete({ where: { email } });
  }
}
