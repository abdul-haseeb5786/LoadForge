import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class TestThrottleGuard implements CanActivate {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis(this.configService.get<string>('redis.url') || 'redis://localhost:6379');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Assumes user is authenticated and req.user exists
    const userId = request.user?._id?.toString() || request.user?.id;
    if (!userId) return false;

    const key = `rate:test:${userId}`;
    const limit = 10;
    const ttl = 3600; // 1 hour in seconds

    const currentCount = await this.redisClient.incr(key);
    
    if (currentCount === 1) {
      await this.redisClient.expire(key, ttl);
    }

    const ttlRemaining = await this.redisClient.ttl(key);

    response.header('X-RateLimit-Limit', limit.toString());
    response.header('X-RateLimit-Remaining', Math.max(0, limit - currentCount).toString());
    response.header('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + Math.max(0, ttlRemaining)).toString());

    if (currentCount > limit) {
      throw new HttpException('Too many test executions', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
