import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/lib/prisma/prisma.service';

const testEmailPrefix = `auth-e2e-${process.pid}-${Date.now()}`;
const validPassword = 'P@ssw0';

interface Registration {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface UserResponse {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  password?: unknown;
  expires_at?: string;
}

interface ErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

function createRegistration(label: string): Registration {
  return {
    first_name: 'Jane',
    last_name: 'Doe',
    email: `${testEmailPrefix}-${label}@example.com`,
    password: validPassword,
  };
}

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const api = () => request(app.getHttpServer());
  const createAgent = () => request.agent(app.getHttpServer());

  async function registerAndLogin(registration: Registration) {
    const agent = createAgent();

    await agent.post('/api/auth/register/email-password').send(registration).expect(201);
    await agent
      .post('/api/auth/login/email-password')
      .send({ email: registration.email, password: registration.password })
      .expect(201);

    return agent;
  }

  async function deleteTestUsers() {
    await prisma.user.deleteMany({
      where: { email: { startsWith: testEmailPrefix } },
    });
  }

  function expectSafeUser(response: request.Response, registration: Registration) {
    const body = response.body as UserResponse;

    expect(response.headers['content-type']).toMatch(/json/);
    expect(body).toEqual(
      expect.objectContaining({
        first_name: registration.first_name,
        last_name: registration.last_name,
        email: registration.email,
        role: 'user',
        is_active: true,
      }),
    );
    expect(body.created_at).toEqual(expect.any(String));
    expect(body.updated_at).toEqual(expect.any(String));
    expect(body.password).toBeUndefined();
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The production limit is intentionally not part of endpoint behavior tests.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await deleteTestUsers();
  });

  afterAll(async () => {
    await deleteTestUsers();
    await app.close();
  });

  describe('POST /api/auth/register/email-password', () => {
    it('registers a user with the password omitted from the response', async () => {
      const registration = createRegistration('register');

      const response = await api()
        .post('/api/auth/register/email-password')
        .send(registration)
        .expect(201);

      expectSafeUser(response, registration);

      const storedUser = (await prisma.user.findUnique({
        where: { email: registration.email },
      })) as { password: string } | null;
      expect(storedUser).not.toBeNull();
      expect(storedUser?.password).not.toBe(registration.password);
      expect(storedUser?.password).toEqual(expect.any(String));
    });

    it('accepts a password at the six-character minimum boundary', async () => {
      const registration = createRegistration('minimum-password');

      const response = await api()
        .post('/api/auth/register/email-password')
        .send(registration)
        .expect(201);

      expectSafeUser(response, registration);
    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      const registration = createRegistration('duplicate');

      await api().post('/api/auth/register/email-password').send(registration).expect(201);

      const response = await api()
        .post('/api/auth/register/email-password')
        .send({ ...registration, first_name: 'Different' })
        .expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        message: 'The record already exists',
        error: 'Conflict',
      });
    });

    it.each([
      [
        'missing first name',
        {
          last_name: 'Doe',
          email: 'person@example.com',
          password: validPassword,
        },
      ],
      [
        'missing last name',
        {
          first_name: 'Jane',
          email: 'person@example.com',
          password: validPassword,
        },
      ],
      ['missing email', { first_name: 'Jane', last_name: 'Doe', password: validPassword }],
      ['missing password', { first_name: 'Jane', last_name: 'Doe', email: 'person@example.com' }],
      [
        'empty first name',
        {
          first_name: '',
          last_name: 'Doe',
          email: 'person@example.com',
          password: validPassword,
        },
      ],
      [
        'empty last name',
        {
          first_name: 'Jane',
          last_name: '',
          email: 'person@example.com',
          password: validPassword,
        },
      ],
      [
        'empty email',
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: '',
          password: validPassword,
        },
      ],
      [
        'invalid email',
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'not-an-email',
          password: validPassword,
        },
      ],
      [
        'uppercase email',
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'Person@example.com',
          password: validPassword,
        },
      ],
      [
        'short password',
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'person@example.com',
          password: '12345',
        },
      ],
      [
        'null first name',
        {
          first_name: null,
          last_name: 'Doe',
          email: 'person@example.com',
          password: validPassword,
        },
      ],
      [
        'non-string password',
        {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'person@example.com',
          password: 123456,
        },
      ],
    ])('rejects %s with 400 Bad Request', async (_case, payload) => {
      const response = await api()
        .post('/api/auth/register/email-password')
        .send(payload)
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(400);
      expect(body.message).toEqual(expect.any(Array));
    });

    it('rejects unknown properties instead of silently accepting them', async () => {
      const response = await api()
        .post('/api/auth/register/email-password')
        .send({ ...createRegistration('unknown-property'), unexpected: true })
        .expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'property unexpected should not exist',
      );
    });

    it('rejects malformed JSON', async () => {
      const response = await api()
        .post('/api/auth/register/email-password')
        .set('Content-Type', 'application/json')
        .send('{"email":')
        .expect(400);

      expect((response.body as ErrorResponse).statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login/email-password', () => {
    it('logs in with valid credentials and omits the password', async () => {
      const registration = createRegistration('login');
      const agent = createAgent();
      await agent.post('/api/auth/register/email-password').send(registration).expect(201);

      const response = await agent
        .post('/api/auth/login/email-password')
        .send({ email: registration.email, password: registration.password })
        .expect(201);

      expectSafeUser(response, registration);
      const body = response.body as UserResponse;
      expect(body).not.toHaveProperty('session_token');
      expect(body.expires_at).toEqual(expect.any(String));
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('session=')]),
      );

      const meResponse = await agent.get('/api/auth/me').expect(200);
      expectSafeUser(meResponse, registration);
    });

    it('rejects an incorrect password with 401 Unauthorized', async () => {
      const registration = createRegistration('wrong-password');
      await api().post('/api/auth/register/email-password').send(registration).expect(201);

      const response = await api()
        .post('/api/auth/login/email-password')
        .send({ email: registration.email, password: 'wrong-password' })
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Password is incorrect',
        error: 'Unauthorized',
      });
    });

    it('returns 404 for an email that is not registered', async () => {
      const response = await api()
        .post('/api/auth/login/email-password')
        .send({
          email: `${testEmailPrefix}-missing@example.com`,
          password: validPassword,
        })
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'The record was not found',
        error: 'Not Found',
      });
    });

    it.each([
      ['missing email', { password: validPassword }],
      ['missing password', { email: 'person@example.com' }],
      ['empty email', { email: '', password: validPassword }],
      ['empty password', { email: 'person@example.com', password: '' }],
      ['invalid email', { email: 'not-an-email', password: validPassword }],
      ['non-string email', { email: 123, password: validPassword }],
    ])('rejects %s with 400 Bad Request', async (_case, payload) => {
      const response = await api().post('/api/auth/login/email-password').send(payload).expect(400);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(400);
      expect(body.message).toEqual(expect.any(Array));
    });

    it('rejects unknown login properties', async () => {
      const response = await api()
        .post('/api/auth/login/email-password')
        .send({
          email: `${testEmailPrefix}-unknown-login@example.com`,
          password: validPassword,
          rememberMe: true,
        })
        .expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'property rememberMe should not exist',
      );
    });
  });

  describe('session endpoints', () => {
    it('rejects protected endpoints without a session', async () => {
      await api().get('/api/auth/me').expect(401);
      await api().post('/api/auth/logout').expect(401);
      await api().delete('/api/auth/delete-account').expect(401);
    });

    it('rejects an unknown session token', async () => {
      await api().get('/api/auth/me').set('Cookie', 'session=missing-session').expect(401);
    });

    it('logs out and revokes the current session', async () => {
      const registration = createRegistration('logout');
      const agent = await registerAndLogin(registration);

      const response = await agent.post('/api/auth/logout').expect(201);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('session=;')]),
      );

      await agent.get('/api/auth/me').expect(401);
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    it('deletes an existing user and never returns the password', async () => {
      const registration = createRegistration('delete');
      const agent = await registerAndLogin(registration);

      const response = await agent.delete('/api/auth/delete-account').expect(200);

      expectSafeUser(response, registration);
      expect(await prisma.user.findUnique({ where: { email: registration.email } })).toBeNull();
      await api()
        .post('/api/auth/login/email-password')
        .send({ email: registration.email, password: registration.password })
        .expect(404);
      await agent.get('/api/auth/me').expect(401);
    });

    it('revokes all sessions when deleting an account', async () => {
      const registration = createRegistration('delete-twice');
      const firstAgent = await registerAndLogin(registration);
      const secondAgent = createAgent();

      await secondAgent
        .post('/api/auth/login/email-password')
        .send({ email: registration.email, password: registration.password })
        .expect(201);

      await firstAgent.delete('/api/auth/delete-account').expect(200);
      await secondAgent.get('/api/auth/me').expect(401);
    });

    it('requires a fresh session after account deletion', async () => {
      const registration = createRegistration('delete-again');
      const agent = await registerAndLogin(registration);

      await agent.delete('/api/auth/delete-account').expect(200);
      await agent.delete('/api/auth/delete-account').expect(401);
    });

    it('allows the deleted email to register again with a new password', async () => {
      const registration = createRegistration('reuse-email');
      const agent = await registerAndLogin(registration);

      await agent.delete('/api/auth/delete-account').expect(200);

      const replacement = {
        ...registration,
        first_name: 'Recreated',
        password: `${validPassword}-new`,
      };
      const response = await api()
        .post('/api/auth/register/email-password')
        .send(replacement)
        .expect(201);

      expectSafeUser(response, replacement);
      await api()
        .post('/api/auth/login/email-password')
        .send({ email: replacement.email, password: registration.password })
        .expect(401);
      await api()
        .post('/api/auth/login/email-password')
        .send({ email: replacement.email, password: replacement.password })
        .expect(201);
    });
  });
});
