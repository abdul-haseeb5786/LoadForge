const fs = require('fs');
const path = require('path');

const writeFileSync = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log('Created:', filePath);
};

// ---------------------------------------------
// Backend Configs & Defaults
// ---------------------------------------------
writeFileSync('backend/.env', `
MONGODB_URI=mongodb://localhost:27017/loadforge
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super-secret-key-for-loadforge-api
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
PORT=3000
`);

writeFileSync('backend/src/config/redis.config.ts', `
import { registerAs } from '@nestjs/config';
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));
`);

writeFileSync('backend/src/config/mongodb.config.ts', `
import { registerAs } from '@nestjs/config';
export default registerAs('mongodb', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/loadforge',
}));
`);

writeFileSync('backend/src/config/jwt.config.ts', `
import { registerAs } from '@nestjs/config';
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'super-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
}));
`);

// ---------------------------------------------
// Backend Common (Guards, Interceptors, etc)
// ---------------------------------------------
writeFileSync('backend/src/common/guards/jwt-auth.guard.ts', `
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
`);

writeFileSync('backend/src/common/guards/throttle.guard.ts', `
import { Injectable, ExecutionContext } from '@nestjs/common';
// Would technically use @nestjs/throttler, stubbed functionality per requirements
@Injectable()
export class ThrottleGuard {
  canActivate(context: ExecutionContext): boolean {
    return true; // Implement actual throttling logic here
  }
}
`);

writeFileSync('backend/src/common/interceptors/response.interceptor.ts', `
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ data, timestamp: new Date().toISOString() })));
  }
}
`);

writeFileSync('backend/src/common/filters/http-exception.filter.ts', `
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
`);

writeFileSync('backend/src/common/decorators/current-user.decorator.ts', `
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
`);

// ---------------------------------------------
// Backend Modules - Users
// ---------------------------------------------
writeFileSync('backend/src/modules/users/user.schema.ts', `
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  googleId?: string;

  @Prop()
  githubId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
`);

writeFileSync('backend/src/modules/users/users.service.ts', `
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userDto: any): Promise<User> {
    const user = new this.userModel(userDto);
    return user.save();
  }
}
`);

writeFileSync('backend/src/modules/users/users.module.ts', `
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`);

// ---------------------------------------------
// Backend Modules - Auth
// ---------------------------------------------
writeFileSync('backend/src/modules/auth/dto/login.dto.ts', `
export class LoginDto {
  email!: string;
  password!: string;
}
`);

writeFileSync('backend/src/modules/auth/strategies/jwt.strategy.ts', `
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
`);

writeFileSync('backend/src/modules/auth/strategies/google.strategy.ts', `
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'mock',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'mock',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      googleId: id,
      accessToken
    };
    done(null, user);
  }
}
`);

writeFileSync('backend/src/modules/auth/strategies/github.strategy.ts', `
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'mock',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || 'mock',
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const user = {
      email: profile.emails?.[0]?.value,
      githubId: profile.id,
      accessToken
    };
    done(null, user);
  }
}
`);

writeFileSync('backend/src/modules/auth/auth.service.ts', `
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateOAuthUser(profile: any, providerIdField: string): Promise<any> {
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      user = await this.usersService.create({ 
        email: profile.email,
        [providerIdField]: profile[providerIdField] 
      });
    }
    return user;
  }

  async loginWithEmail(loginDto: any) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async generateToken(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
`);

writeFileSync('backend/src/modules/auth/auth.controller.ts', `
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithEmail(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.generateToken(req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Req() req) {
    return this.authService.generateToken(req.user);
  }
}
`);

writeFileSync('backend/src/modules/auth/auth.module.ts', `
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
`);

// ---------------------------------------------
// Backend Modules - Queue
// ---------------------------------------------
writeFileSync('backend/src/modules/queue/queue.processor.ts', `
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('load-test')
export class QueueProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log('Processing load test job:', job.id, job.data);
    // Simulate test execution delay
    return new Promise(resolve => setTimeout(() => {
      resolve({ status: 'completed', result: 'Success' });
    }, 2000));
  }
}
`);

writeFileSync('backend/src/modules/queue/queue.module.ts', `
import { Module } from '@nestjs/common';
import { QueueProcessor } from './queue.processor';

@Module({
  providers: [QueueProcessor],
})
export class QueueModule {}
`);

// ---------------------------------------------
// Backend Modules - Test Runner
// ---------------------------------------------
writeFileSync('backend/src/modules/test-runner/dto/create-test.dto.ts', `
export class CreateTestDto {
  targetUrl!: string;
  virtualUsers!: number;
  durationSeconds!: number;
}
`);

writeFileSync('backend/src/modules/test-runner/test-runner.gateway.ts', `
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class TestRunnerGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('status-update')
  handleStatusUpdate(@MessageBody() data: any): string {
    this.server.emit('status-update', data);
    return 'Status broadcasted';
  }
}
`);

writeFileSync('backend/src/modules/test-runner/test-runner.service.ts', `
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TestRunnerGateway } from './test-runner.gateway';

@Injectable()
export class TestRunnerService {
  constructor(
    @InjectQueue('load-test') private loadTestQueue: Queue,
    private gateway: TestRunnerGateway
  ) {}

  async startTest(testConfig: any) {
    const job = await this.loadTestQueue.add('execute-test', testConfig);
    this.gateway.server.emit('test-started', { jobId: job.id });
    return job;
  }
}
`);

writeFileSync('backend/src/modules/test-runner/test-runner.controller.ts', `
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTestDto } from './dto/create-test.dto';

@Controller('test-runner')
@UseGuards(JwtAuthGuard)
export class TestRunnerController {
  constructor(private testRunnerService: TestRunnerService) {}

  @Post('start')
  async startTest(@Body() createTestDto: CreateTestDto) {
    return this.testRunnerService.startTest(createTestDto);
  }
}
`);

writeFileSync('backend/src/modules/test-runner/test-runner.module.ts', `
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { TestRunnerGateway } from './test-runner.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'load-test',
    }),
  ],
  providers: [TestRunnerService, TestRunnerGateway],
  controllers: [TestRunnerController],
})
export class TestRunnerModule {}
`);

// ---------------------------------------------
// Backend Modules - History
// ---------------------------------------------
writeFileSync('backend/src/modules/history/test-result.schema.ts', `
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TestResult extends Document {
  @Prop({ required: true })
  targetUrl: string;

  @Prop()
  status: string;

  @Prop()
  summary: string;
}

export const TestResultSchema = SchemaFactory.createForClass(TestResult);
`);

writeFileSync('backend/src/modules/history/dto/filter-history.dto.ts', `
export class FilterHistoryDto {
  targetUrl?: string;
}
`);

writeFileSync('backend/src/modules/history/history.service.ts', `
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestResult } from './test-result.schema';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(TestResult.name) private resultModel: Model<TestResult>) {}

  async findAll() {
    return this.resultModel.find().exec();
  }
}
`);

writeFileSync('backend/src/modules/history/history.controller.ts', `
import { Controller, Get, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  async getHistory() {
    return this.historyService.findAll();
  }
}
`);

writeFileSync('backend/src/modules/history/history.module.ts', `
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TestResult, TestResultSchema } from './test-result.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: TestResult.name, schema: TestResultSchema }])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
`);

// ---------------------------------------------
// Backend App Module & Main Configuration
// ---------------------------------------------
writeFileSync('backend/src/app.module.ts', `
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import redisConfig from './config/redis.config';
import mongodbConfig from './config/mongodb.config';
import jwtConfig from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TestRunnerModule } from './modules/test-runner/test-runner.module';
import { HistoryModule } from './modules/history/history.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, mongodbConfig, jwtConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    TestRunnerModule,
    HistoryModule,
    QueueModule,
  ],
})
export class AppModule {}
`);

writeFileSync('backend/src/main.ts', `
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
`);
