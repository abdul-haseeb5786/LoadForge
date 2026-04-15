import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;
  private readonly logger = new Logger(PusherService.name);

  constructor(private configService: ConfigService) {
    const appId = this.configService.get<string>('PUSHER_APP_ID') || '2141932';
    const key = this.configService.get<string>('PUSHER_KEY') || '92272ce4d2df5c2d4fec';
    const secret = this.configService.get<string>('PUSHER_SECRET') || '5f935fe6f6d03b27341f';
    const cluster = this.configService.get<string>('PUSHER_CLUSTER') || 'ap2';

    this.pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
    
    this.logger.log('Pusher initialized successfully');
  }

  async trigger(channel: string, event: string, data: any) {
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      this.logger.error(`Failed to trigger Pusher event: ${error.message}`);
    }
  }
}
