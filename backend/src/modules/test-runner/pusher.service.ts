import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;
  private readonly logger = new Logger(PusherService.name);

  constructor(private configService: ConfigService) {
    const appId = this.configService.get<string>('PUSHER_APP_ID');
    const key = this.configService.get<string>('PUSHER_KEY');
    const secret = this.configService.get<string>('PUSHER_SECRET');
    const cluster = this.configService.get<string>('PUSHER_CLUSTER');

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
