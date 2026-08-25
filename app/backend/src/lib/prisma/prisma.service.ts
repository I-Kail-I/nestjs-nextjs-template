import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@/generated/prisma/client';
import { isDevelopment } from '@/utils/check-env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: isDevelopment
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.$queryRawUnsafe(`SELECT 1`);
    console.log('database is connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log('database disconnected');
  }
}
