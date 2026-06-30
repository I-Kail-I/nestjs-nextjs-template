import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { DbService } from '@/db/db.service';

@Injectable()
export class AuthService {
  public auth: ReturnType<typeof betterAuth>;

  constructor(private db: DbService) {
    this.auth = betterAuth({
      database: prismaAdapter(this.db, {
        provider: 'postgresql',
      }),
      emailAndPassword: {
        enabled: true,
      },
      advanced: {
        disableCSRFCheck: process.env.NODE_ENV === 'development',
      },
    }) as ReturnType<typeof betterAuth>;
  }

  async handler(req: Request): Promise<Response> {
    return this.auth.handler(req);
  }
}
