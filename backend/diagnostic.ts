import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { HistoryService } from './src/modules/history/history.service';
import { UsersService } from './src/modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const historyService = app.get(HistoryService);
  const usersService = app.get(UsersService);

  console.log('--- DIAGNOSTIC START ---');
  
  // 1. Check all users
  const userModel = usersService['userModel'];
  const users = await userModel.find().exec();
  console.log(`Found ${users.length} users in DB.`);
  users.forEach(u => console.log(`User: ${u.email} ID: ${u._id}`));

  // 2. Check all test results
  const resultModel = historyService['resultModel'];
  const allResults = await resultModel.find().exec();
  console.log(`Found ${allResults.length} total test results in DB.`);
  
  if (allResults.length > 0) {
    console.log('Sample Result UserID:', allResults[allResults.length - 1].userId);
    console.log('Sample Result Status:', allResults[allResults.length - 1].status);
  }

  console.log('--- DIAGNOSTIC END ---');
  await app.close();
}
bootstrap();
