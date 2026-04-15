import { Module } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { PusherService } from './pusher.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    HistoryModule,
  ],
  providers: [TestRunnerService, PusherService],
  controllers: [TestRunnerController],
  exports: [TestRunnerService, PusherService],
})
export class TestRunnerModule {}
