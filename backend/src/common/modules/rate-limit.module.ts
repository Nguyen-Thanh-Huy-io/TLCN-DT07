import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { THROTTLER_CONFIG } from '../config/throttler.config';
import { CustomThrottlerGuard } from '../guards/custom-throttler.guard';

/**
 * ThrottlerStorageRedisService không tự đóng Redis client truyền từ ngoài vào;
 * lớp bọc này đảm bảo kết nối Redis được giải phóng khi app tắt (test E2E, graceful shutdown).
 */
class OwnedThrottlerStorageRedisService
  extends ThrottlerStorageRedisService
  implements OnModuleDestroy
{
  constructor(private readonly ownedClient: Redis) {
    super(ownedClient);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ownedClient.status !== 'end') {
      await this.ownedClient.quit().catch(() => {
        this.ownedClient.disconnect(false);
      });
    }
  }
}

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        // Create Redis client for throttler storage
        const redisClient = new Redis({
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          username: configService.get<string>('REDIS_USER'),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          keyPrefix: `${configService.get<string>('REDIS_CACHE_KEY_PREFIX', 'app')}:throttle:`,
          maxRetriesPerRequest: 1,
        });
        redisClient.on('error', () => {
          // Tránh Unhandled error event khi Redis container đang khởi động
        });

        return {
          throttlers: [
            {
              name: 'default',
              ttl: THROTTLER_CONFIG.DEFAULT.ttl,
              limit: THROTTLER_CONFIG.DEFAULT.limit,
            },
          ],
          storage: new OwnedThrottlerStorageRedisService(redisClient),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Apply custom rate limiting globally to all routes
    // This guard skips Swagger, metrics, and other infrastructure endpoints
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
