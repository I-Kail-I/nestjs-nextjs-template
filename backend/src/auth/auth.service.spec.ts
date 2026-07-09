import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@/generated/prisma/enums';
import { comparePassword, hashPassword } from '@/lib/bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('@/common/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

jest.mock('@/lib/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));

function createMockUser(overrides = {}) {
  return {
    id: '1',
    email: 'test@example.com',
    password: 'hashed',
    first_name: 'John',
    last_name: 'Doe',
    role: 'USER' as Role,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

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
      const user = createMockUser();
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

      const mockCreatedUser = createMockUser({
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
      });

      const createSpy = jest.spyOn(prisma.user, 'create').mockResolvedValue(mockCreatedUser);

      const result = await service.register(dto);

      // Expect the full user object since password is not being omitted
      expect(result).toEqual(mockCreatedUser);

      expect(hashPassword).toHaveBeenCalledWith(dto.password);
      expect(createSpy).toHaveBeenCalledWith({
        data: { ...dto, password: 'hashed-password' },
        omit: { password: true },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingUser = createMockUser({ email: dto.email });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };

    it('should return user without password on valid credentials', async () => {
      const user = createMockUser();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      const { password, ...expectedResult } = user;
      expect(result).toEqual(expectedResult);
      expect(comparePassword).toHaveBeenCalledWith('123456', 'hashed');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const user = createMockUser();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when email is not registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the user', async () => {
      const user = createMockUser();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      const deleteSpy = jest.spyOn(prisma.user, 'delete').mockResolvedValue(user);

      const result = await service.remove('test@example.com');

      expect(result).toEqual(user);
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('missing@example.com')).rejects.toThrow(NotFoundException);
    });
  });
});
