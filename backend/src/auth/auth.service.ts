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
  private static saltRounds: number = 12;

  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string): Promise<LoginDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email is not registered');
    }

    return user;
  }

  async register(createAuthDto: CreateAuthDto): Promise<Omit<CreateAuthDto, 'password'>> {
    const hashPassword = await bcrypt.hash(createAuthDto.password, AuthService.saltRounds);

    const checkEmail = await this.prisma.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (checkEmail) {
      throw new ConflictException('Email is already register');
    }

    const user = await this.prisma.user.create({
      data: { ...createAuthDto, password: hashPassword },
      omit: { password: true },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<Omit<LoginDto, 'password'>> {
    const user = await this.findOne(loginDto.email);

    const checkPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!checkPassword) {
      throw new UnauthorizedException('Password are incorrect');
    }

    const { password, ...result } = user;

    return result;
  }

  async remove(email: string): Promise<CreateAuthDto> {
    await this.findOne(email);

    return this.prisma.user.delete({ where: { email } });
  }
}
