import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findOrCreateOAuthUser(profile: any, provider: 'google' | 'github'): Promise<UserDocument> {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@${provider}.local`;
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      user = new this.userModel({
        name: profile.displayName || profile.username || 'OAuth User',
        email: email,
        provider: provider,
        [provider === 'google' ? 'googleId' : 'githubId']: profile.id,
        avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      });
      await user.save();
    } else {
      let updated = false;
      if (provider === 'google' && !user.googleId) {
        user.googleId = profile.id;
        updated = true;
      } else if (provider === 'github' && !user.githubId) {
        user.githubId = profile.id;
        updated = true;
      }
      
      if (!user.avatar && profile.photos && profile.photos.length > 0) {
        user.avatar = profile.photos[0].value;
        updated = true;
      }

      if (updated) {
        await user.save();
      }
    }

    return user;
  }
}
