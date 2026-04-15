import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { TestRunnerGateway } from './test-runner.gateway';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'load-test',
    }),
    HistoryModule,
  ],
  providers: [TestRunnerService, TestRunnerGateway],
  controllers: [TestRunnerController],
  exports: [TestRunnerService],
})
export class TestRunnerModule {}
