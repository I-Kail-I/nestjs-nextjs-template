import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach, afterEach, jest, type Mock } from 'bun:test';
import { Role } from '@/generated/prisma/enums';
import { BcryptService } from '@/lib/bcrypt/bcrypt.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { RedisService } from '@/lib/redis/redis.service';
import { AuthService } from './auth.service';
import { sessionRedisKey, SESSION_TTL_MS } from './passport-session.strategy';

const asMock = <T extends (...args: any[]) => any>(fn: unknown): Mock<T> => fn as Mock<T>;

const mockPrisma = {
  user: {
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockBcrypt = {
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
};

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BcryptService, useValue: mockBcrypt },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);

      const result = await service.findOne('test@example.com');
      expect(result).toEqual(user);
    });

    it('should propagate when the user is not found', async () => {
      asMock(mockPrisma.user.findUniqueOrThrow).mockRejectedValue(new NotFoundException());

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

      asMock(mockPrisma.user.create).mockResolvedValue(safeUser);

      const result = await service.register(dto);

      expect(result).toEqual(safeUser);
      expect(mockBcrypt.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(asMock(mockPrisma.user.create)).toHaveBeenCalledWith({
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

      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(true);
      asMock(mockPrisma.session.create).mockResolvedValue({ id: 'session-1' });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      const result = await service.login(loginDto);

      const { password, ...expectedResult } = user;
      expect(result).toEqual({
        ...expectedResult,
        session_token: 'session-1',
        expires_at: expiresAt,
      });
      expect(mockBcrypt.comparePassword).toHaveBeenCalledWith('123456', 'hashed');
      expect(asMock(mockPrisma.session.create)).toHaveBeenCalledWith({
        data: { user_id: user.id, expires_at: expiresAt },
        select: { id: true },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        sessionRedisKey('session-1'),
        JSON.stringify(expectedResult),
        'PX',
        SESSION_TTL_MS,
      );
      nowSpy.mockRestore();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const user = createMockUser();

      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });

    it('should reject inactive users without creating a session', async () => {
      const user = createMockUser({ is_active: false });

      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);
      mockBcrypt.comparePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow('User is not active');
      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when email is not registered', async () => {
      asMock(mockPrisma.user.findUniqueOrThrow).mockRejectedValue(new NotFoundException());

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockBcrypt.comparePassword).not.toHaveBeenCalled();
      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete the Redis and DB session when a token is provided', async () => {
      await service.logout('session-1');

      expect(mockRedis.del).toHaveBeenCalledWith(sessionRedisKey('session-1'));
      expect(asMock(mockPrisma.session.deleteMany)).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('should ignore missing tokens', async () => {
      await service.logout(undefined);

      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(asMock(mockPrisma.session.deleteMany)).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete Redis sessions, DB sessions, and delete the user', async () => {
      const user = createMockUser();
      const { password: _password, ...safeUser } = user;

      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);
      asMock(mockPrisma.session.findMany).mockResolvedValue([
        { id: 'session-1' },
        { id: 'session-2' },
      ]);
      asMock(mockPrisma.session.deleteMany).mockResolvedValue({ count: 2 });
      asMock(mockPrisma.user.delete).mockResolvedValue(safeUser);

      const callOrder: string[] = [];
      mockRedis.del.mockImplementation(() => {
        callOrder.push('redis');
        return Promise.resolve(1);
      });
      asMock(mockPrisma.session.deleteMany).mockImplementation(() => {
        callOrder.push('db');
        return Promise.resolve({ count: 2 });
      });

      const result = await service.remove(user.id);

      expect(result).toEqual(safeUser);
      expect(callOrder).toEqual(['redis', 'db']);
      expect(mockRedis.del).toHaveBeenCalledWith('session:session-1', 'session:session-2');
      expect(asMock(mockPrisma.session.findMany)).toHaveBeenCalledWith({
        where: { user_id: user.id },
        select: { id: true },
      });
      expect(asMock(mockPrisma.session.deleteMany)).toHaveBeenCalledWith({
        where: { user_id: user.id },
      });
      expect(asMock(mockPrisma.user.delete)).toHaveBeenCalledWith({
        where: { id: user.id },
        omit: { password: true },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      asMock(mockPrisma.user.findUniqueOrThrow).mockRejectedValue(new NotFoundException());

      await expect(service.remove('missing-user-id')).rejects.toThrow(NotFoundException);
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(asMock(mockPrisma.session.deleteMany)).not.toHaveBeenCalled();
      expect(asMock(mockPrisma.user.delete)).not.toHaveBeenCalled();
    });

    it('should reject an inactive user without deleting it', async () => {
      const user = createMockUser({ is_active: false });
      asMock(mockPrisma.user.findUniqueOrThrow).mockResolvedValue(user);

      await expect(service.remove(user.id)).rejects.toThrow('User is already not active');
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(asMock(mockPrisma.session.deleteMany)).not.toHaveBeenCalled();
      expect(asMock(mockPrisma.user.delete)).not.toHaveBeenCalled();
    });
  });
});
