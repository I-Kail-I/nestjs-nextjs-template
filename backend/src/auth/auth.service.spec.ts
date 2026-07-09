import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/lib/bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('@/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the user when found', async () => {
      const user = { email: 'test@example.com', password: 'hashed' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await service.findOne('test@example.com');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: '123456',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should create a user with hashed password and omit password from result', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
      });
      expect(hashPassword).toHaveBeenCalledWith(dto.password);

      expect(jest.spyOn(prisma.user, 'create')).toHaveBeenCalledWith({
        data: { ...dto, password: 'hashed-password' },
        omit: { password: true },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };

    it('should return user without password on valid credentials', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({ email: 'test@example.com', first_name: 'John', last_name: 'Doe' });
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when email is not registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the user', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.user.delete as jest.Mock).mockResolvedValue(user);

      const result = await service.remove('test@example.com');

      expect(result).toEqual(user);

      expect(jest.spyOn(prisma.user, 'delete')).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('missing@example.com')).rejects.toThrow(NotFoundException);
    });
  });
});
