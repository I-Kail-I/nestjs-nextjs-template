import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@/generated/prisma/enums';
import { BcryptService } from '@/lib/bcrypt/bcrypt.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { AuthService } from './auth.service';
import { SESSION_TTL_MS } from './passport-session.strategy';

jest.mock('@/lib/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: {
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

const mockBcrypt = {
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
};

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
      providers: [AuthService, PrismaService, { provide: BcryptService, useValue: mockBcrypt }],
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
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);

      const result = await service.findOne('test@example.com');
      expect(result).toEqual(user);
    });

    it('should propagate when the user is not found', async () => {
      (prisma.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(new NotFoundException());

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
      const mockCreatedUser = createMockUser({
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
      });
      const { password: _password, ...safeUser } = mockCreatedUser;

      (prisma.user.create as jest.Mock).mockResolvedValue(safeUser);

      const result = await service.register(dto);

      expect(result).toEqual(safeUser);
      expect(mockBcrypt.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { ...dto, password: 'hashed-password' },
        omit: { password: true },
      });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };

    it('should return user without password and create a session on valid credentials', async () => {
      const user = createMockUser();
      const expiresAt = new Date(1_000_000 + SESSION_TTL_MS);

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      const result = await service.login(loginDto);

      const { password, ...expectedResult } = user;
      expect(result).toEqual({
        ...expectedResult,
        session_token: 'session-1',
        expires_at: expiresAt,
      });
      expect(mockBcrypt.comparePassword).toHaveBeenCalledWith('123456', 'hashed');
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { user_id: user.id, expires_at: expiresAt },
        select: { id: true },
      });
      nowSpy.mockRestore();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const user = createMockUser();

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('should reject inactive users without creating a session', async () => {
      const user = createMockUser({ is_active: false });

      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow('User is not active');
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when email is not registered', async () => {
      (prisma.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockBcrypt.comparePassword).not.toHaveBeenCalled();
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
      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.delete as jest.Mock).mockResolvedValue(safeUser);

      const result = await service.remove(user.id);

      expect(result).toEqual(safeUser);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { user_id: user.id } });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: user.id },
        omit: { password: true },
      });
      expect((prisma.session.deleteMany as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
        (prisma.user.delete as jest.Mock).mock.invocationCallOrder[0],
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
