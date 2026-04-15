import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestResult } from './test-result.schema';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(TestResult.name) private resultModel: Model<TestResult>) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    
    const query: any = {
      $or: [
        { userId: userId },
        ...(userObjectId ? [{ userId: userObjectId }] : [])
      ]
    };

    const [data, total] = await Promise.all([
      this.resultModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.resultModel.countDocuments(query).exec()
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const result = await this.resultModel.findById(id).exec();
    if (!result) throw new NotFoundException('Test not found');
    if (result.userId.toString() !== userObjectId.toString()) throw new UnauthorizedException();
    return result;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.resultModel.findByIdAndDelete(id).exec();
    return { success: true };
  }

  async updateName(id: string, userId: string, name: string) {
    const result = await this.findOne(id, userId);
    result.name = name;
    await result.save();
    return result;
  }

  async saveResult(data: any) {
    if (data.userId && typeof data.userId === 'string') {
      data.userId = new Types.ObjectId(data.userId);
    }
    const result = new this.resultModel(data);
    return result.save();
  }
}
