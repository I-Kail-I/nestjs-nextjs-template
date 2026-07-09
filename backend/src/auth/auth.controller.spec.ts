import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
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

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    remove: jest.fn(),
  };

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
      const expected = { email: 'test@example.com', first_name: 'John', last_name: 'Doe' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { email: 'test@example.com', password: '123456' };
      const expected = { email: 'test@example.com' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('remove', () => {
    it('should call authService.remove with the email', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
      };
      mockAuthService.remove.mockResolvedValue(user);

      const result = await controller.remove('test@example.com');

      expect(result).toEqual(user);
      expect(mockAuthService.remove).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw when authService.remove throws', async () => {
      mockAuthService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('missing@example.com')).rejects.toThrow(NotFoundException);
    });
  });
});
