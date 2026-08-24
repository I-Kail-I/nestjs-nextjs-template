import type { Response } from 'express';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach, jest } from 'bun:test';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AuthenticatedRequest,
  SafeUser,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './passport-session.strategy';
import { AuthResponseDto } from './dto/response-auth.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    remove: jest.fn(),
  };

  function createResponse(): Response {
    return {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;
  }

  function createUser(): SafeUser {
    return {
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'user',
      is_active: true,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    };
  }

  function createRequest(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
      cookies: {},
      user: createUser(),
      ...overrides,
    } as AuthenticatedRequest;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto = {
        email: 'test@example.com',
        password: '123456',
        first_name: 'John',
        last_name: 'Doe',
      };
      const expected: AuthResponseDto = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should set session cookie and omit token from response', async () => {
      const loginDto = { email: 'test@example.com', password: '123456' };
      const expected = {
        ...createUser(),
        session_token: 'session-1',
        expires_at: new Date('2026-01-08T00:00:00.000Z'),
      };
      const nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date('2026-01-01T00:00:00.000Z').getTime());
      const response = createResponse();
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto, response);

      expect(result).toEqual({
        ...createUser(),
        expires_at: expected.expires_at,
      });
      expect(result).not.toHaveProperty('session_token');
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(response.cookie).toHaveBeenCalledWith(SESSION_COOKIE, 'session-1', {
        ...sessionCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      nowSpy.mockRestore();
    });

    it('should not set a cookie when login fails', async () => {
      const response = createResponse();
      mockAuthService.login.mockRejectedValue(new NotFoundException());

      await expect(
        controller.login({ email: 'missing@example.com', password: '123456' }, response),
      ).rejects.toThrow(NotFoundException);

      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return the authenticated user', () => {
      const request = createRequest();

      expect(controller.me(request)).toEqual(request.user);
    });
  });

  describe('logout', () => {
    it('should revoke session and clear the session cookie', async () => {
      const request = createRequest({ cookies: { [SESSION_COOKIE]: 'session-1' } });
      const response = createResponse();
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(request, response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('session-1');
      expect(response.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, sessionCookieOptions);
    });

    it('should clear cookie even when no session token is present', async () => {
      const request = createRequest();
      const response = createResponse();
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(request, response);

      expect(mockAuthService.logout).toHaveBeenCalledWith(undefined);
      expect(response.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, sessionCookieOptions);
    });
  });

  describe('remove', () => {
    it('should remove authenticated user by id and clear cookie', async () => {
      const request = createRequest();
      const response = createResponse();
      const user = createUser();
      mockAuthService.remove.mockResolvedValue(user);

      const result = await controller.remove(request, response);

      expect(result).toEqual(user);
      expect(mockAuthService.remove).toHaveBeenCalledWith(user.id);
      expect(response.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, sessionCookieOptions);
    });

    it('should throw when authService.remove throws', async () => {
      const request = createRequest();
      const response = createResponse();
      mockAuthService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(request, response)).rejects.toThrow(NotFoundException);
      expect(response.clearCookie).not.toHaveBeenCalled();
    });
  });
});
