import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TestRunnerService } from '../test-runner/test-runner.service';
import { forwardRef, Inject } from '@nestjs/common';

@Processor('load-test')
export class QueueProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => TestRunnerService)) private testRunnerService: TestRunnerService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { config, userId, socketId } = job.data;
    console.log(`[Queue] Processing load test job ID: ${job.id}`);
    return this.testRunnerService.runTest(config, userId, socketId);
  }
}
