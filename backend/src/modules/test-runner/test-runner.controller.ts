import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TestThrottleGuard } from '../../common/guards/test-throttle.guard';
import { CreateTestDto } from './dto/create-test.dto';

@Controller('api/test')
@UseGuards(JwtAuthGuard)
export class TestRunnerController {
  constructor(private testRunnerService: TestRunnerService) {}

  @Post('run')
  @UseGuards(TestThrottleGuard)
  async startTest(@Body() createTestDto: CreateTestDto, @Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    
    // We start the test directly on Vercel
    // We fire and forget or await depending on the desired behavior, 
    // but on serverless it's better to await to keep the function alive as long as possible.
    const result = await this.testRunnerService.runTest(createTestDto, userId, createTestDto.socketId);
    
    return { success: true, resultId: (result as any)._id };
  }

  @Post('stop')
  async stopTest(@Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    await this.testRunnerService.stopTest(userId);
    return { success: true, message: 'Stop flag set' };
  }

  @Get('limits')
  async getLimits(@Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    const key = `rate:test:${userId}`;
    const count = parseInt(await this.testRunnerService['redisClient'].get(key) || '0', 10);
    return { limit: 10, remaining: Math.max(0, 10 - count), count };
  }
}
