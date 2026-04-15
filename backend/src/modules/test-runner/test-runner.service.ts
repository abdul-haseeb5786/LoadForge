import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from './pusher.service';
import { HistoryService } from '../history/history.service';
import { CreateTestDto } from './dto/create-test.dto';
import { Redis } from 'ioredis';
const pLimit = require('p-limit');

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);
  private redisClient: Redis;

  constructor(
    private pusherService: PusherService,
    private historyService: HistoryService,
    private configService: ConfigService
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || this.configService.get<string>('redis.url') || 'redis://localhost:6379';
    this.logger.log(`Connecting to Redis: ${redisUrl.split('@')[1] || 'local'}`);
    this.redisClient = new Redis(redisUrl);
  }


  async stopTest(userId: string) {
    await this.redisClient.set(`test:stop:${userId}`, '1', 'EX', 3600);
  }

  async runTest(config: CreateTestDto, userId: string, socketId: string): Promise<any> {
    const limit = pLimit(config.concurrency);
    const stopKey = `test:stop:${userId}`;
    await this.redisClient.del(stopKey);

    let completed = 0;
    let successCount = 0;
    let failCount = 0;
    
    const timeline: any[] = [];
    const errors: any[] = [];

    // Target the room linked to userId
    const emitTarget = userId;

    const makeRequest = async (requestNumber: number) => {
      const isStopped = await this.redisClient.get(stopKey);
      if (isStopped) {
        throw new Error('STOP_FLAG_TRIGGERED');
      }

      if (config.delay && config.delay > 0 && requestNumber > 1) {
        await new Promise(r => setTimeout(r, config.delay));
      }

      const startTime = performance.now();
      let statusCode = 0;
      let success = false;
      let errorMessage = '';

      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers as HeadersInit,
          body: config.body && config.method !== 'GET' ? JSON.stringify(config.body) : undefined,
        });
        
        statusCode = response.status;
        success = response.ok;
      } catch (err: any) {
        statusCode = 500;
        success = false;
        errorMessage = err.message;
      }

      const responseTime = performance.now() - startTime;

      if (success) {
        successCount++;
      } else {
        failCount++;
        errors.push({
          requestNumber,
          statusCode,
          message: errorMessage || `Failed with status ${statusCode}`,
          responseTime
        });
      }

      timeline.push({
        requestNumber,
        responseTime,
        statusCode,
        success,
        timestamp: new Date()
      });

      completed++;

      this.pusherService.trigger(`user-${userId}`, 'progress', {
        completed,
        total: config.totalRequests,
        lastStatus: statusCode,
        lastResponseTime: responseTime,
        successCount,
        failCount
      });
      
      if (completed % 10 === 0) {
        this.logger.debug(`[${userId}] Progress: ${completed}/${config.totalRequests} (S:${successCount} F:${failCount})`);
      }
    };

    try {
      const tasks = Array.from({ length: config.totalRequests }).map((_, i) =>
        limit(() => makeRequest(i + 1).catch(err => {
          if (err.message === 'STOP_FLAG_TRIGGERED') {
             throw err; // Propagate up to break Promise.all
          } else {
             this.logger.error(err);
          }
        }))
      );

      await Promise.all(tasks);
    } catch (err: any) {
      if (err.message === 'STOP_FLAG_TRIGGERED') {
        this.pusherService.trigger(`user-${userId}`, 'stopped', { message: 'Test execution was stopped by the user.' });
      } else {
        this.pusherService.trigger(`user-${userId}`, 'error', { message: 'An unexpected error occurred during test execution.' });
        throw err;
      }
    }

    const wasStopped = await this.redisClient.get(stopKey);
    const finalStatus = wasStopped ? 'stopped' : (failCount === config.totalRequests && config.totalRequests > 0 ? 'failed' : 'completed');

    const times = timeline.map(t => t.responseTime);
    const avgResponseTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const minResponseTime = times.length > 0 ? Math.min(...times) : 0;
    const maxResponseTime = times.length > 0 ? Math.max(...times) : 0;
    const successRate = completed > 0 ? (successCount / completed) * 100 : 0;

    const resultBody = {
      userId,
      name: config.name,
      config,
      results: {
        total: completed,
        success: successCount,
        failed: failCount,
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        successRate,
        errors,
        timeline
      },
      status: finalStatus
    };

    const savedResult = await this.historyService.saveResult(resultBody);
    this.logger.log(`[${userId}] Simulation finalized. Status: ${finalStatus}. ID: ${savedResult._id}`);

    if (finalStatus === 'completed' || finalStatus === 'failed') {
      this.pusherService.trigger(`user-${userId}`, 'completed', { 
        message: 'Test execution finished successfully.', 
        resultId: savedResult._id.toString() 
      });
    }

    return savedResult;
  }
}
