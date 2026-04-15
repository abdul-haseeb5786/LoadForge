import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TestResult, TestResultSchema } from './test-result.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: TestResult.name, schema: TestResultSchema }])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule {}
