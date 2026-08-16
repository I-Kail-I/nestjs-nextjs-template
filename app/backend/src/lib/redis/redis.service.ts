import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.on('error', (error) => {
      console.warn(`[Redis] connection error: ${error.message}`);
    });
  }

  onModuleInit(): void {
    void this.connect()
      .then(() => console.log('redis is connected'))
      .catch((error: unknown) => {
        console.warn(`[Redis] failed to connect on startup: ${(error as Error).message}`);
      });
  }

  onModuleDestroy(): void {
    this.disconnect();
    console.log('redis disconnected');
  }
}
