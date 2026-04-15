import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';

export type TestResultDocument = TestResult & Document;

export interface TestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body: Record<string, any>;
  totalRequests: number;
  concurrency: number;
  delay: number;
}

export interface TestError {
  requestNumber: number;
  statusCode: number;
  message: string;
  responseTime: number;
}

export interface TestTimeline {
  requestNumber: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
}

export interface TestResultMetrics {
  total: number;
  success: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  errors: TestError[];
  timeline: TestTimeline[];
}

@Schema({ timestamps: true })
export class TestResult {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | User;

  @Prop()
  name?: string;

  @Prop(raw({
    url: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true },
    headers: { type: MongooseSchema.Types.Mixed, default: {} },
    body: { type: MongooseSchema.Types.Mixed, default: {} },
    totalRequests: { type: Number, required: true },
    concurrency: { type: Number, required: true },
    delay: { type: Number, required: true }
  }))
  config: TestConfig;

  @Prop(raw({
    total: { type: Number, required: true },
    success: { type: Number, required: true },
    failed: { type: Number, required: true },
    avgResponseTime: { type: Number, required: true },
    minResponseTime: { type: Number, required: true },
    maxResponseTime: { type: Number, required: true },
    successRate: { type: Number, required: true },
    errors: [{
      requestNumber: Number,
      statusCode: Number,
      message: String,
      responseTime: Number
    }],
    timeline: [{
      requestNumber: Number,
      responseTime: Number,
      statusCode: Number,
      success: Boolean,
      timestamp: Date
    }]
  }))
  results: TestResultMetrics;

  @Prop({ type: String, enum: ['running', 'completed', 'failed', 'stopped'], required: true })
  status: string;
}

export const TestResultSchema = SchemaFactory.createForClass(TestResult);
