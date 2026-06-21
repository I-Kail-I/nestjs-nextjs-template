import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { PrismaClient } from '@/generated/prisma/client';

export function createAuth(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [],
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8000',
    secret: process.env.BETTER_AUTH_SECRET ?? 'your-secret-key-change-this',
  });
}
