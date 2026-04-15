import { Module, forwardRef } from '@nestjs/common';
import { QueueProcessor } from './queue.processor';
import { TestRunnerModule } from '../test-runner/test-runner.module';

@Module({
  imports: [forwardRef(() => TestRunnerModule)],
  providers: [QueueProcessor],
})
export class QueueModule {}
