import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Role } from '@/generated/prisma/enums';
import { comparePassword, hashPassword } from '@/lib/bcrypt';
import { AuthService } from './auth.service';
import { SESSION_TTL_MS } from './passport-session.strategy';

jest.mock('@/common/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
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
    role: Role.user,
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

  afterEach(() => {
    jest.restoreAllMocks();
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
      const { password: _password, ...safeUser } = mockCreatedUser;

      const createSpy = jest.spyOn(prisma.user, 'create').mockResolvedValue(safeUser);

      const result = await service.register(dto);

      expect(result).toEqual(safeUser);

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
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };

    it('should return user without password and create a session on valid credentials', async () => {
      const user = createMockUser();
      const expiresAt = new Date(1_000_000 + SESSION_TTL_MS);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      const result = await service.login(loginDto);

      const { password, ...expectedResult } = user;
      expect(result).toEqual({
        ...expectedResult,
        session_token: 'session-1',
        expires_at: expiresAt,
      });
      expect(comparePassword).toHaveBeenCalledWith('123456', 'hashed');
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { user_id: user.id, expires_at: expiresAt },
        select: { id: true },
      });
      nowSpy.mockRestore();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const user = createMockUser();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('should reject inactive users without creating a session', async () => {
      const user = createMockUser({ is_active: false });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow('User is not active');
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when email is not registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(comparePassword).not.toHaveBeenCalled();
      expect(prisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete the session when a token is provided', async () => {
      await service.logout('session-1');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });

    it('should ignore missing tokens', async () => {
      await service.logout(undefined);

      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete sessions, delete user, and return user without password', async () => {
      const user = createMockUser();
      const { password: _password, ...safeUser } = user;

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      const sessionDeleteSpy = jest
        .spyOn(prisma.session, 'deleteMany')
        .mockResolvedValue({ count: 1 });
      const deleteSpy = jest.spyOn(prisma.user, 'delete').mockResolvedValue(safeUser);

      const result = await service.remove(user.id);

      expect(result).toEqual(safeUser);
      expect(sessionDeleteSpy).toHaveBeenCalledWith({ where: { user_id: user.id } });
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: user.id },
        omit: { password: true },
      });
      expect(sessionDeleteSpy.mock.invocationCallOrder[0]).toBeLessThan(
        deleteSpy.mock.invocationCallOrder[0],
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(service.remove('missing-user-id')).rejects.toThrow(NotFoundException);
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should reject an inactive user without deleting it', async () => {
      const user = createMockUser({ is_active: false });
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);

      await expect(service.remove(user.id)).rejects.toThrow('User is already not active');
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
