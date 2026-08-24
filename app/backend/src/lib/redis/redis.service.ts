import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.on('connect', () => console.log('redis is connected'));
    this.on('error', (error) => {
      console.warn(`[Redis] connection error: ${error.message}`);
    });
  }

  onModuleDestroy(): void {
    this.disconnect();
    console.log('redis disconnected');
  }
}
