import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  password?: string;

  @Prop()
  googleId?: string;

  @Prop()
  githubId?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: ['local', 'google', 'github'], default: 'local' })
  provider: string;

  @Prop({ default: 0 })
  testsRunThisHour: number;

  @Prop()
  lastTestReset?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
